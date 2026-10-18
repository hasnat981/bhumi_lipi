"""Use cases of Bhumi Lipi. Framework-free: the HTTP layer (api.py) only calls these methods.

Reading guide for the team (each part can be explained in 60 seconds):
  1. _append_block       -> how a deed becomes a signed, chained block
  2. register_sale       -> rules first, then block, then lock, then mutation
  3. check_plot / verify -> what citizens see (Green / Amber / Red, Genuine / Outdated / Forged)
  4. decide              -> AC Land approves (unlock) or rejects (append a REVERSAL block)
  5. integrity / anchor  -> proof that history was not rewritten
  6. lab_run             -> five attacks run on a COPY of the database
"""
import json
import re
import sqlite3
import threading
import time

from . import chain, mutation, rules
from . import db as dbmod
from .chain import GENESIS

PLOT_RE = re.compile(r"^[A-Z]{3}-[A-Z]{3}-\d{4}$")
HEX64 = re.compile(r"[0-9a-fA-F]{64}")


class ApiError(Exception):
    def __init__(self, status: int, code: str, bn: str, en: str, **extra):
        super().__init__(en)
        self.status, self.code, self.bn, self.en, self.extra = status, code, bn, en, extra

    def body(self) -> dict:
        return {"error": {"code": self.code, "bn": self.bn, "en": self.en, **self.extra}}


# Messages used only in this file (rule messages live in rules.py)
M = {
    "CHAIN_BROKEN": ("ডিজিটাল সিল মিলছে না। রেকর্ড বদলানো হয়ে থাকতে পারে।",
                     "The digital seal does not match. The record may have been altered."),
    "MUTATION_PENDING": ("বিক্রি নিবন্ধিত হয়েছে, কিন্তু নামজারি এখনও শেষ হয়নি।",
                         "A sale was registered, but mutation is not finished yet."),
    "MUTATION_FLAGGED": ("নামজারিতে সতর্কতা আছে; কর্মকর্তা দেখছেন।",
                         "The mutation has warnings and an officer is reviewing it."),
}

HEADLINE = {
    "green": ("এই জমির কাগজ আসল। কোনো সমস্যা পাওয়া যায়নি।", "This land record is genuine. No problems found."),
    "amber": ("সতর্ক থাকুন। কেনার আগে নিচের বিষয়গুলো দেখুন।", "Be careful. Check the points below before buying."),
    "red": ("এখন কিনবেন না। গুরুতর সমস্যা পাওয়া গেছে।", "Do not buy now. Serious problems found."),
}

ADVICE = {
    "green": [("বিক্রেতার পরিচয়পত্র দলিলের নামের সাথে মিলিয়ে নিন।", "Match the seller's ID with the name on the deed."),
              ("কেনার পর নামজারির আবেদন করুন।", "Apply for mutation right after buying.")],
    "amber": [("সমস্যাগুলো মেটার আগে টাকা দেবেন না।", "Do not pay until these points are cleared."),
              ("স্থানীয় ভূমি অফিস বা আইনজীবীর সাথে কথা বলুন।", "Talk to the local land office or a lawyer.")],
    "red": [("কোনো টাকা দেবেন না।", "Do not pay any money."),
            ("সংশ্লিষ্ট ভূমি অফিসে খোঁজ নিন।", "Ask the relevant land office.")],
}


def sha256(text_or_bytes) -> str:
    return chain.sha256_hex(text_or_bytes)


def office_for(plot_id: str) -> str:
    return "SR-" + plot_id.split("-")[0]


def make_document(plot_id, mouza, area, kind, deed_no, frm, to, price, ts, office_id) -> str:
    """Plain-text deed copy. Its SHA-256 is stored in the block (doc_hash). Anyone holding a
    copy can drop it on the Verify page: one changed character means a different hash."""
    date = time.strftime("%d %b %Y", time.gmtime(ts))
    return "\n".join([
        "BHUMI LIPI - DEMO DEED COPY (synthetic data, not a legal document)",
        "ভূমি লিপি - ডেমো দলিল কপি (বানানো তথ্য)",
        "-" * 52,
        f"Deed no / দলিল নং   : {deed_no}",
        f"Type / ধরন         : {kind}",
        f"Plot / প্লট         : {plot_id}",
        f"Mouza / মৌজা       : {mouza}",
        f"Area / পরিমাণ      : {area} decimal",
        f"Seller / বিক্রেতা   : {frm}",
        f"Buyer / ক্রেতা      : {to}",
        f"Price / মূল্য       : BDT {price:,}",
        f"Date / তারিখ       : {date}",
        f"Office / অফিস      : {office_id}",
        "",
    ])


def _clean_name(value, field: str) -> str:
    if not isinstance(value, str):
        raise ApiError(400, "BAD_INPUT", f"{field} লিখুন।", f"{field} is required.")
    v = " ".join(value.split())
    if not 2 <= len(v) <= 80 or any(ord(c) < 32 for c in v):
        raise ApiError(400, "BAD_INPUT", f"{field} ২ থেকে ৮০ অক্ষরের হতে হবে।", f"{field} must be 2 to 80 characters.")
    return v


def _plot_id(value) -> str:
    v = (value or "").strip().upper() if isinstance(value, str) else ""
    if not PLOT_RE.match(v):
        raise ApiError(400, "BAD_PLOT", "প্লট নম্বরের ধরন ঠিক নেই (যেমন DHK-UTT-0142)।",
                       "Plot number looks wrong (example: DHK-UTT-0142).")
    return v


def _price(value) -> int:
    try:
        p = int(value)
    except (TypeError, ValueError):
        raise ApiError(400, "BAD_PRICE", "দাম সংখ্যায় লিখুন।", "Price must be a number.")
    if not 0 <= p <= 10**12:
        raise ApiError(400, "BAD_PRICE", "দাম সঠিক সীমার মধ্যে দিন।", "Price is out of range.")
    return p


class Service:
    def __init__(self, con: sqlite3.Connection, keyring: chain.Keyring, clock=None):
        self.con, self.keyring = con, keyring
        self.clock = clock or (lambda: int(time.time()))
        self.lock = threading.RLock()

    # ------------------------------------------------------------ small helpers
    def now(self) -> int:
        return int(self.clock())

    def _one(self, sql, args=()):
        r = self.con.execute(sql, args).fetchone()
        return dict(r) if r else None

    def _all(self, sql, args=()):
        return [dict(r) for r in self.con.execute(sql, args)]

    def _plot(self, plot_id):
        return self._one("SELECT * FROM plots WHERE plot_id=?", (plot_id,))

    def _blocks(self, plot_id, with_doc=False):
        cols = "*" if with_doc else ("id,plot_id,seq,kind,deed_no,frm,\"to\",ts,doc_hash,price_bdt,"
                                     "office_id,prev,hash,sig")
        return self._all(f"SELECT {cols} FROM blocks WHERE plot_id=? ORDER BY seq", (plot_id,))

    def _alert(self, plot_id, code, level, detail, actor):
        self.con.execute("INSERT INTO alerts(ts,plot_id,code,level,detail,actor) VALUES(?,?,?,?,?,?)",
                         (self.now(), plot_id, code, level, json.dumps(detail, ensure_ascii=False), actor))

    def _audit(self, actor, action, plot_id="", ip_hash=""):
        self.con.execute("INSERT INTO audit_log(ts,actor,action,plot_id,ip_hash) VALUES(?,?,?,?,?)",
                         (self.now(), actor, action, plot_id, ip_hash))

    def has_data(self) -> bool:
        return self._one("SELECT COUNT(*) c FROM plots")["c"] > 0

    # ------------------------------------------------------------ 1. blocks
    def _append_block(self, plot_id, kind, frm, to, price, ts, deed_no=None) -> dict:
        """Create the next block of a plot: document -> doc_hash -> chained hash -> signature."""
        plot = self._plot(plot_id)
        last = self._one("SELECT seq, hash FROM blocks WHERE plot_id=? ORDER BY seq DESC LIMIT 1", (plot_id,))
        seq = (last["seq"] + 1) if last else 1
        prev = last["hash"] if last else GENESIS
        office = office_for(plot_id)
        deed_no = deed_no or f"DEED-{plot_id}-{seq:03d}"
        doc = make_document(plot_id, plot["mouza"], plot["area_decimal"], kind, deed_no, frm, to, price, ts, office)
        b = dict(plot_id=plot_id, seq=seq, kind=kind, deed_no=deed_no, frm=frm, to=to, ts=ts,
                 doc_hash=sha256(doc), price_bdt=price, office_id=office, prev=prev)
        b["hash"] = chain.block_hash(b)
        b["sig"] = self.keyring.sign(office, b["hash"])
        self.con.execute(
            'INSERT INTO blocks(plot_id,seq,kind,deed_no,frm,"to",ts,doc_hash,doc,price_bdt,office_id,prev,hash,sig)'
            " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (plot_id, seq, kind, deed_no, frm, to, ts, b["doc_hash"], doc, price, office, prev, b["hash"], b["sig"]))
        return b

    def verify_plot_chain(self, plot_id) -> dict:
        """Re-check everything: seq order, prev links, hashes, signatures, document hashes,
        and that ownership replays correctly from the first block to the current owner."""
        blocks = self._blocks(plot_id, with_doc=True)
        plot = self._plot(plot_id)
        prev, owner = GENESIS, None

        def bad(seq, reason):
            return {"ok": False, "first_bad_seq": seq, "reason": reason, "length": len(blocks)}

        for i, b in enumerate(blocks):
            if b["seq"] != i + 1:
                return bad(b["seq"], "SEQ")
            if b["prev"] != prev:
                return bad(b["seq"], "LINK")
            if chain.block_hash(b) != b["hash"]:
                return bad(b["seq"], "HASH")
            if not self.keyring.verify(b["office_id"], b["hash"], b["sig"]):
                return bad(b["seq"], "SIGNATURE")
            if sha256(b["doc"]) != b["doc_hash"]:
                return bad(b["seq"], "DOCUMENT")
            if b["kind"] != "INIT" and b["frm"] != owner:
                return bad(b["seq"], "OWNER_JUMP")
            prev, owner = b["hash"], b["to"]
        if plot and blocks and plot["owner"] != owner:
            return bad(len(blocks), "STATE_MISMATCH")
        return {"ok": True, "first_bad_seq": None, "reason": None, "length": len(blocks)}

    # ------------------------------------------------------------ rule context
    def _survey(self, plot_id) -> dict:
        rec = self._all("SELECT survey,khatian_no,holder,area_decimal FROM survey_records WHERE plot_id=? "
                        "ORDER BY CASE survey WHEN 'CS' THEN 1 WHEN 'SA' THEN 2 WHEN 'RS' THEN 3 ELSE 4 END", (plot_id,))
        areas = [r["area_decimal"] for r in rec]
        mismatch = bool(areas) and (max(areas) - min(areas)) / max(areas) > 0.05
        return {"records": rec, "mismatch": mismatch}

    def _context(self, plot_id, plot, seller, buyer, price) -> dict:
        if plot is None:
            return {"plot": None}
        now = self.now()
        sales = self._all("SELECT ts FROM blocks WHERE plot_id=? AND kind='SALE'", (plot_id,))
        ppd = [r["price_bdt"] / r["area_decimal"] for r in self._all(
            "SELECT b.price_bdt, p.area_decimal FROM blocks b JOIN plots p ON p.plot_id=b.plot_id "
            "WHERE p.mouza=? AND b.kind='SALE' AND b.price_bdt>0", (plot["mouza"],))]
        recent = self._one('SELECT COUNT(*) c FROM blocks WHERE kind=\'SALE\' AND "to"=? AND ts>? AND plot_id!=?',
                           (buyer, now - rules.RAPID_WINDOW, plot_id))["c"]
        lien = self._one("SELECT 1 x FROM liens WHERE plot_id=? AND released=0", (plot_id,)) is not None
        return {"plot": plot, "seller": seller, "buyer": buyer, "price": price, "area": plot["area_decimal"],
                "sale_ts": [r["ts"] for r in sales], "median_ppd": rules.median(ppd), "buyer_recent": recent,
                "lien": lien, "survey_mismatch": self._survey(plot_id)["mismatch"], "now": now}

    @staticmethod
    def _risk(flags) -> dict:
        s = rules.risk_score(flags)
        return {"score": s, "level": rules.risk_level(s)}

    # ------------------------------------------------------------ 2. registration
    def register_sale(self, actor, plot_id, seller, buyer, price, dry_run=False, ip_hash="") -> dict:
        plot_id, seller, buyer, price = _plot_id(plot_id), _clean_name(seller, "বিক্রেতার নাম / Seller"), \
            _clean_name(buyer, "ক্রেতার নাম / Buyer"), _price(price)
        with self.lock:
            plot = self._plot(plot_id)
            flags = rules.evaluate(self._context(plot_id, plot, seller, buyer, price))
            risk = self._risk(flags)
            is_blocked = rules.blocked(flags)
            if dry_run:
                return {"allowed": not is_blocked, "flags": flags, "risk": risk}
            if is_blocked:
                with self.con:
                    for f in flags:
                        if f["level"] == "block":
                            self._alert(plot_id, f["code"], "block", {"seller": seller, "buyer": buyer, "price": price}, actor)
                    self._audit(actor, "SALE_BLOCKED", plot_id, ip_hash)
                raise ApiError(409, "SALE_BLOCKED", "বিক্রি আটকানো হয়েছে।", "Sale blocked.", flags=flags, risk=risk)

            ts = self.now()
            with self.con:
                b = self._append_block(plot_id, "SALE", seller, buyer, price, ts)
                self.con.execute("UPDATE plots SET owner=?, locked=1 WHERE plot_id=?", (buyer, plot_id))
                checks = mutation.run_checks(flags, signature_ok=True)
                final = "AUTO_PASSED" if mutation.all_passed(checks) else "FLAGGED"
                tracking = "MUT-" + b["hash"][:8].upper()
                cur = self.con.execute(
                    "INSERT INTO mutations(tracking_id,plot_id,deed_hash,state,checks,created_ts,updated_ts)"
                    " VALUES(?,?,?,?,?,?,?)",
                    (tracking, plot_id, b["hash"], final, json.dumps(checks, ensure_ascii=False), ts, ts))
                mid = cur.lastrowid
                for st, who in (("SUBMITTED", actor), ("AUTO_CHECKING", "system"), (final, "system")):
                    self.con.execute("INSERT INTO mutation_events(mutation_id,state,actor,note,ts) VALUES(?,?,?,?,?)",
                                     (mid, st, who, "", ts))
                for f in flags:
                    self._alert(plot_id, f["code"], "warn", {"deed": b["hash"], "buyer": buyer}, actor)
                self._audit(actor, "SALE_REGISTERED", plot_id, ip_hash)
            return {"allowed": True, "hash": b["hash"], "seq": b["seq"], "deed_no": b["deed_no"],
                    "doc_hash": b["doc_hash"], "tracking_id": tracking, "mutation_state": final,
                    "plot_status": "LOCKED", "flags": flags, "risk": risk, "ts": ts}

    # ------------------------------------------------------------ 3. citizen views
    def list_plots(self) -> list:
        """Plots with their citizen verdict (green / amber / red) for the picker page."""
        rows = self._all("SELECT plot_id,mouza,owner,locked,area_decimal FROM plots ORDER BY plot_id")
        for r in rows:
            r["verdict"] = self.check_plot(r["plot_id"])["verdict"]
        return rows

    def _latest_mutation(self, plot_id):
        m = self._one("SELECT tracking_id,state,created_ts,updated_ts FROM mutations WHERE plot_id=? ORDER BY id DESC LIMIT 1",
                      (plot_id,))
        if m:
            m["label"] = dict(zip(("bn", "en"), mutation.LABELS[m["state"]]))
        return m

    def check_plot(self, plot_id) -> dict:
        plot_id = _plot_id(plot_id)
        with self.lock:
            plot = self._plot(plot_id)
            if not plot:
                raise ApiError(404, "NO_PLOT", "এই প্লট রেজিস্ট্রিতে পাওয়া যায়নি।", "This plot is not in the registry.")
            ch = self.verify_plot_chain(plot_id)
            hist = self._blocks(plot_id)
            mut = self._latest_mutation(plot_id)
            lien = self._one("SELECT bank,amount_bdt,ts FROM liens WHERE plot_id=? AND released=0", (plot_id,))
            survey = self._survey(plot_id)
            now = self.now()
            reasons = []

            def add(level, code, bn, en):
                reasons.append({"code": code, "level": level, "bn": bn, "en": en})

            if not ch["ok"]:
                add("red", "CHAIN_BROKEN", *M["CHAIN_BROKEN"])
            if lien:
                add("red", "LIEN", rules.RULES["LIEN"][2], rules.RULES["LIEN"][3])
            if plot["khas"] or plot["acquisition"]:
                add("red", "GOV_LAND", rules.RULES["GOV_LAND"][2], rules.RULES["GOV_LAND"][3])
            if plot["locked"]:
                key = "MUTATION_FLAGGED" if mut and mut["state"] == "FLAGGED" else "MUTATION_PENDING"
                add("amber", key, *M[key])
            if plot["court_case"]:
                add("amber", "COURT_CASE", rules.RULES["COURT_CASE"][2], rules.RULES["COURT_CASE"][3])
            if survey["mismatch"]:
                add("amber", "SURVEY_MISMATCH", rules.RULES["SURVEY_MISMATCH"][2], rules.RULES["SURVEY_MISMATCH"][3])
            if sum(1 for b in hist if b["kind"] == "SALE" and now - b["ts"] < rules.RAPID_WINDOW) >= 2:
                add("amber", "RAPID_TRANSFER", rules.RULES["RAPID_TRANSFER"][2], rules.RULES["RAPID_TRANSFER"][3])

            verdict = "red" if any(r["level"] == "red" for r in reasons) else "amber" if reasons else "green"
            return {
                "plot": {"plot_id": plot_id, "mouza": plot["mouza"], "owner": plot["owner"], "locked": bool(plot["locked"]),
                         "area_decimal": plot["area_decimal"], "khas": bool(plot["khas"]),
                         "acquisition": bool(plot["acquisition"]), "court_case": bool(plot["court_case"])},
                "verdict": verdict, "headline": dict(zip(("bn", "en"), HEADLINE[verdict])), "reasons": reasons,
                "advice": [dict(zip(("bn", "en"), a)) for a in ADVICE[verdict]],
                "chain": ch, "history": hist, "mutation": mut, "lien": lien, "survey": survey,
            }

    def verify(self, hash_value=None, doc_hash=None) -> dict:
        """Verify a seal (QR / pasted code) or a document hash (dropped file)."""
        raw = (hash_value or doc_hash or "")
        m = HEX64.search(raw) if isinstance(raw, str) else None
        if not m:
            raise ApiError(400, "BAD_CODE", "সিল কোড ঠিক নেই। ৬৪ অক্ষরের কোড দিন।", "Seal code looks wrong. Use the 64-character code.")
        h = m.group(0).lower()
        with self.lock:
            col = "hash" if hash_value else "doc_hash"
            b = self._one(f"SELECT plot_id,seq,kind,deed_no,frm,\"to\",ts,price_bdt,hash,doc_hash FROM blocks WHERE {col}=?", (h,))
            if not b:
                return {"result": "FORGED", "bn": "এই সিল রেজিস্ট্রিতে নেই। কাগজটি জাল বা বদলানো।",
                        "en": "No record has this seal. The document is forged or altered."}
            ch = self.verify_plot_chain(b["plot_id"])
            latest = self._one("SELECT MAX(seq) m FROM blocks WHERE plot_id=?", (b["plot_id"],))["m"]
            base = {"plot_id": b["plot_id"], "seq": b["seq"], "kind": b["kind"], "deed_no": b["deed_no"],
                    "frm": b["frm"], "to": b["to"], "ts": b["ts"], "hash": b["hash"], "matched_by": col}
            if not ch["ok"]:
                return {**base, "result": "CHAIN_BROKEN", "bn": "এই প্লটের রেকর্ডের সিল ভেঙে গেছে। বিশ্বাস করবেন না।",
                        "en": "The record chain of this plot is broken. Do not trust it."}
            if b["seq"] == latest:
                return {**base, "result": "GENUINE", "bn": "খাঁটি দলিল। সিল মিলেছে এবং এটিই সর্বশেষ রেকর্ড।",
                        "en": "Genuine deed. The seal matches and this is the latest record."}
            return {**base, "result": "OUTDATED", "bn": "দলিল আসল, কিন্তু পুরোনো। এরপর জমি অন্য কারও নামে গেছে।",
                    "en": "The deed is real but outdated. The land has changed hands since."}

    def deed_by_hash(self, h) -> dict:
        m = HEX64.search(h or "")
        b = self._one("SELECT plot_id,seq,kind,deed_no,frm,\"to\",ts,price_bdt,hash,doc_hash,doc,office_id FROM blocks WHERE hash=?",
                      (m.group(0).lower() if m else "",))
        if not b:
            raise ApiError(404, "NO_DEED", "এই সিলের কোনো দলিল নেই।", "No deed with this seal.")
        return b

    # ------------------------------------------------------------ 4. mutation
    def mutation_status(self, tracking_id) -> dict:
        m = self._one("SELECT * FROM mutations WHERE tracking_id=?", ((tracking_id or "").strip().upper(),))
        if not m:
            raise ApiError(404, "NO_MUTATION", "এই ট্র্যাকিং নম্বর পাওয়া যায়নি।", "Tracking number not found.")
        events = self._all("SELECT state,actor,note,ts FROM mutation_events WHERE mutation_id=? ORDER BY id", (m["id"],))
        for e in events:
            e["label"] = dict(zip(("bn", "en"), mutation.LABELS[e["state"]]))
        block = self._one('SELECT seq,frm,"to",price_bdt,hash FROM blocks WHERE hash=?', (m["deed_hash"],))
        decided = m["state"] in ("APPROVED", "REJECTED")
        days = max(0, ((m["updated_ts"] if decided else self.now()) - m["created_ts"]) // 86400)
        return {"tracking_id": m["tracking_id"], "plot_id": m["plot_id"], "state": m["state"],
                "waiting_days": days, "aging": mutation.aging(m["state"], days),
                "label": dict(zip(("bn", "en"), mutation.LABELS[m["state"]])), "checks": json.loads(m["checks"]),
                "events": events, "deed": block, "created_ts": m["created_ts"], "updated_ts": m["updated_ts"]}

    def mutation_queue(self) -> list:
        rows = self._all("SELECT tracking_id FROM mutations WHERE state IN ('AUTO_PASSED','FLAGGED') ORDER BY id")
        return [self.mutation_status(r["tracking_id"]) for r in rows]

    def decide(self, actor, tracking_id, decision, note="", ip_hash="") -> dict:
        new_state = {"approve": "APPROVED", "reject": "REJECTED"}.get(decision)
        note = " ".join((note or "").split())[:200]
        if not new_state:
            raise ApiError(400, "BAD_DECISION", "সিদ্ধান্ত approve বা reject হতে হবে।", "Decision must be approve or reject.")
        with self.lock:
            m = self._one("SELECT * FROM mutations WHERE tracking_id=?", ((tracking_id or "").strip().upper(),))
            if not m:
                raise ApiError(404, "NO_MUTATION", "এই ট্র্যাকিং নম্বর পাওয়া যায়নি।", "Tracking number not found.")
            if not mutation.can_move(m["state"], new_state):
                raise ApiError(409, "BAD_STATE", "এই আবেদনের সিদ্ধান্ত আগেই নেওয়া হয়েছে।", "A decision was already made on this application.")
            if m["state"] == "FLAGGED" and len(note) < 3:
                raise ApiError(400, "NOTE_REQUIRED", "সতর্কতাযুক্ত আবেদনে কারণ লিখতে হবে।", "A reason is required for a flagged application.")
            ts = self.now()
            with self.con:
                if new_state == "APPROVED":
                    self.con.execute("UPDATE plots SET locked=0 WHERE plot_id=?", (m["plot_id"],))
                else:
                    sale = self._one('SELECT frm,"to" FROM blocks WHERE hash=?', (m["deed_hash"],))
                    self._append_block(m["plot_id"], "REVERSAL", sale["to"], sale["frm"], 0, ts,
                                       deed_no=f"REV-{m['tracking_id']}")
                    self.con.execute("UPDATE plots SET owner=?, locked=0 WHERE plot_id=?", (sale["frm"], m["plot_id"]))
                self.con.execute("UPDATE mutations SET state=?, updated_ts=? WHERE id=?", (new_state, ts, m["id"]))
                self.con.execute("INSERT INTO mutation_events(mutation_id,state,actor,note,ts) VALUES(?,?,?,?,?)",
                                 (m["id"], new_state, actor, note, ts))
                self._audit(actor, f"MUTATION_{new_state}", m["plot_id"], ip_hash)
            return self.mutation_status(m["tracking_id"])

    # ------------------------------------------------------------ liens (bank)
    def list_liens(self, plot_id=None) -> list:
        if plot_id:
            return self._all("SELECT * FROM liens WHERE plot_id=? ORDER BY id DESC", (_plot_id(plot_id),))
        return self._all("SELECT * FROM liens ORDER BY id DESC")

    def place_lien(self, actor, plot_id, bank, amount, ip_hash="") -> dict:
        plot_id, bank, amount = _plot_id(plot_id), _clean_name(bank, "ব্যাংকের নাম / Bank"), _price(amount)
        with self.lock:
            plot = self._plot(plot_id)
            if not plot:
                raise ApiError(404, "NO_PLOT", "এই প্লট রেজিস্ট্রিতে নেই।", "Plot not found in the registry.")
            if plot["khas"] or plot["acquisition"]:
                raise ApiError(409, "GOV_LAND", *rules.RULES["GOV_LAND"][2:])
            if plot["locked"]:
                raise ApiError(409, "LOCKED", "নামজারি শেষ না হওয়া পর্যন্ত মালিক চূড়ান্ত নন। বন্ধক নেওয়া যাবে না।",
                               "Mutation is not finished, so the owner is not final. A lien cannot be placed.")
            if self._one("SELECT 1 x FROM liens WHERE plot_id=? AND released=0", (plot_id,)):
                self._alert(plot_id, "DOUBLE_MORTGAGE", "block", {"bank": bank, "amount": amount}, actor)
                raise ApiError(409, "DOUBLE_MORTGAGE", "এই জমি আগেই বন্ধক আছে। দ্বিতীয়বার বন্ধক আটকানো হয়েছে।",
                               "This land is already mortgaged. A second mortgage is blocked.")
            with self.con:
                cur = self.con.execute("INSERT INTO liens(plot_id,bank,amount_bdt,ts) VALUES(?,?,?,?)",
                                       (plot_id, bank, amount, self.now()))
                self._audit(actor, "LIEN_PLACED", plot_id, ip_hash)
            return self._one("SELECT * FROM liens WHERE id=?", (cur.lastrowid,))

    def release_lien(self, actor, lien_id, ip_hash="") -> dict:
        with self.lock:
            lien = self._one("SELECT * FROM liens WHERE id=?", (lien_id,))
            if not lien or lien["released"]:
                raise ApiError(404, "NO_LIEN", "সক্রিয় বন্ধক পাওয়া যায়নি।", "No active lien found.")
            with self.con:
                self.con.execute("UPDATE liens SET released=1, released_ts=? WHERE id=?", (self.now(), lien_id))
                self._audit(actor, "LIEN_RELEASED", lien["plot_id"], ip_hash)
            return self._one("SELECT * FROM liens WHERE id=?", (lien_id,))

    # ------------------------------------------------------------ 5. integrity + anchor
    def _all_hashes(self, limit=None) -> list:
        sql = "SELECT hash FROM blocks ORDER BY id" + (f" LIMIT {int(limit)}" if limit is not None else "")
        return [r["hash"] for r in self.con.execute(sql)]

    def ensure_anchor(self) -> dict:
        """Publish a new Merkle root snapshot when new blocks exist. Production: a daily job
        that also posts the root somewhere public (website, newspaper, social media)."""
        with self.lock:
            hashes = self._all_hashes()
            last = self._one("SELECT * FROM anchors ORDER BY id DESC LIMIT 1")
            if last is None or last["block_count"] != len(hashes):
                with self.con:
                    self.con.execute("INSERT INTO anchors(ts,merkle_root,block_count) VALUES(?,?,?)",
                                     (self.now(), chain.merkle_root(hashes), len(hashes)))
                last = self._one("SELECT * FROM anchors ORDER BY id DESC LIMIT 1")
            return last

    def anchor_proof(self, h) -> dict:
        m = HEX64.search(h or "")
        if not m:
            raise ApiError(400, "BAD_CODE", "সিল কোড ঠিক নেই।", "Seal code looks wrong.")
        h = m.group(0).lower()
        with self.lock:
            a = self.ensure_anchor()
            hashes = self._all_hashes()
            if h not in hashes:
                raise ApiError(404, "NO_DEED", "এই সিলের কোনো দলিল নেই।", "No deed with this seal.")
            i = hashes.index(h)
            return {"leaf": h, "index": i, "root": a["merkle_root"], "block_count": a["block_count"],
                    "anchor_ts": a["ts"], "proof": chain.merkle_proof(hashes, i)}

    def _verify_anchors(self) -> dict:
        bad = None
        rows = self._all("SELECT * FROM anchors ORDER BY id")
        for a in rows:
            if chain.merkle_root(self._all_hashes(a["block_count"])) != a["merkle_root"]:
                bad = a["id"]
                break
        return {"ok": bad is None, "checked": len(rows), "first_bad_id": bad}

    def integrity(self) -> dict:
        with self.lock:
            anchor = self.ensure_anchor() if self._all_hashes() else None
            plots = []
            for p in self._all("SELECT plot_id FROM plots ORDER BY plot_id"):
                r = self.verify_plot_chain(p["plot_id"])
                plots.append({"plot_id": p["plot_id"], **r})
            anchors = self._verify_anchors()
            ok_n = sum(1 for p in plots if p["ok"])
            return {"plots": plots, "chains_ok": ok_n, "chains_total": len(plots), "anchors": anchors,
                    "blocks": self._one("SELECT COUNT(*) c FROM blocks")["c"], "latest_anchor": anchor,
                    "healthy": ok_n == len(plots) and anchors["ok"]}

    def stats(self) -> dict:
        with self.lock:
            integ = self.integrity()
            return {"records": integ["blocks"], "plots": integ["chains_total"], "chains_ok": integ["chains_ok"],
                    "healthy": integ["healthy"],
                    "attacks_stopped": self._one("SELECT COUNT(*) c FROM alerts WHERE level='block'")["c"],
                    "mutations_pending": self._one("SELECT COUNT(*) c FROM mutations WHERE state IN ('AUTO_PASSED','FLAGGED')")["c"]}

    def keys(self) -> dict:
        offices = [r["office_id"] for r in self._all("SELECT DISTINCT office_id FROM blocks ORDER BY office_id")]
        return {o: self.keyring.public_b64(o) for o in offices}

    def export(self) -> dict:
        with self.lock:
            self.ensure_anchor()
            return {"format": 1,
                    "blocks": self._all('SELECT plot_id,seq,kind,deed_no,frm,"to",ts,doc_hash,doc,price_bdt,office_id,prev,hash,sig '
                                        "FROM blocks ORDER BY id"),
                    "anchors": self._all("SELECT id,ts,merkle_root,block_count FROM anchors ORDER BY id"),
                    "keys": self.keys()}

    def alerts(self, limit=50) -> list:
        rows = self._all("SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,))
        for r in rows:
            r["detail"] = json.loads(r["detail"])
            rule = rules.RULES.get(r["code"])
            r["message"] = {"bn": rule[2], "en": rule[3]} if rule else {"bn": r["code"], "en": r["code"]}
            if r["code"] == "DOUBLE_MORTGAGE":
                r["message"] = {"bn": "এই জমি আগেই বন্ধক আছে।", "en": "This land is already mortgaged."}
        return rows

    # ------------------------------------------------------------ 6. attack lab
    def lab_run(self) -> list:
        """Run five attacks on a private COPY of the live database. Nothing here touches real data."""
        with self.lock:
            self.ensure_anchor()
            clone = sqlite3.connect(":memory:", check_same_thread=False)
            clone.row_factory = sqlite3.Row
            self.con.backup(clone)
        lab = Service(clone, self.keyring, self.clock)
        results = []

        def record(aid, bn, en, did_bn, did_en, stopped, control_bn, control_en, detail="", outcome="STOPPED"):
            results.append({"id": aid, "title": {"bn": bn, "en": en}, "attack": {"bn": did_bn, "en": did_en},
                            "stopped": stopped, "outcome": outcome, "control": {"bn": control_bn, "en": control_en}, "detail": detail})

        plots = lab.list_plots()
        clean = next((p for p in plots if p["plot_id"] == "DHK-UTT-0142"), None) or next(p for p in plots if not p["locked"] and p["owner"].startswith("Dummy Owner"))
        locked = next(p for p in plots if p["locked"])

        # 1. fake seller
        try:
            lab.register_sale("registrar", clean["plot_id"], "Fraud Seller X", "Fraud Buyer Y", 1000000)
            record("FAKE_SELLER", "জাল বিক্রেতা", "Fake seller", "অন্য কারও জমি নিজের নামে বিক্রির চেষ্টা", "Tried to sell land owned by someone else",
                   False, "", "")
        except ApiError as e:
            codes = ", ".join(f["code"] for f in e.extra.get("flags", []))
            record("FAKE_SELLER", "জাল বিক্রেতা", "Fake seller", "অন্য কারও জমি নিজের নামে বিক্রির চেষ্টা", "Tried to sell land owned by someone else",
                   True, "নিয়ম: বিক্রেতাকে রেকর্ডের মালিক হতে হবে", "Rule: seller must be the registered owner", codes)
        # 2. double sale
        try:
            lab.register_sale("registrar", locked["plot_id"], locked["owner"], "Second Buyer Z", 900000)
            record("DOUBLE_SALE", "একই জমি দুইবার বিক্রি", "Double sale", "নামজারি শেষ হওয়ার আগেই একই জমি আবার বিক্রি", "Sold the same land again before mutation finished",
                   False, "", "")
        except ApiError as e:
            record("DOUBLE_SALE", "একই জমি দুইবার বিক্রি", "Double sale", "নামজারি শেষ হওয়ার আগেই একই জমি আবার বিক্রি", "Sold the same land again before mutation finished",
                   True, "তালা: নামজারি শেষ না হলে জমি লক থাকে", "Lock: land stays locked until mutation is finished",
                   ", ".join(f["code"] for f in e.extra.get("flags", [])))
        # 3. forged file
        sample = lab._one("SELECT doc FROM blocks WHERE plot_id=? ORDER BY seq DESC LIMIT 1", (clean["plot_id"],))["doc"]
        forged = sample.replace("BDT", "BDT 9") if "BDT" in sample else sample + " "
        res = lab.verify(doc_hash=sha256(forged))
        record("FORGED_FILE", "বদলানো দলিলের কপি", "Edited deed copy", "দলিলের দামের ঘরে একটি অক্ষর বদলানো", "Changed one character in the price line",
               res["result"] == "FORGED", "ডিজিটাল সিল: ফাইলের হ্যাশ রেজিস্ট্রির সাথে মেলে না", "Digital seal: file hash does not match the registry", res["result"])
        # 4. direct database edit
        try:
            clone.execute('UPDATE blocks SET "to"=\'Fraud\' WHERE id=1')
            record("DB_EDIT", "ডাটাবেস সরাসরি বদল", "Direct database edit", "ডাটাবেসে সরাসরি পুরোনো রেকর্ড বদলানোর চেষ্টা", "Tried to edit an old record directly in the database",
                   False, "", "")
        except sqlite3.DatabaseError as e:
            record("DB_EDIT", "ডাটাবেস সরাসরি বদল", "Direct database edit", "ডাটাবেসে সরাসরি পুরোনো রেকর্ড বদলানোর চেষ্টা", "Tried to edit an old record directly in the database",
                   True, "ডাটাবেস নিয়ম: রেকর্ড শুধু যোগ করা যায়, বদলানো যায় না", "Database rule: records can only be added, never changed", str(e))
        # 5. insider with a key removes the guard and rewrites history (on the copy)
        victim = next(p for p in lab.list_plots() if len(lab._blocks(p["plot_id"])) >= 2)["plot_id"]
        for name in dbmod.TRIGGER_NAMES:
            clone.execute(f"DROP TRIGGER IF EXISTS {name}")
        lab._rewrite_history(victim, 2, "Fraud Buyer Z")
        integ = lab.integrity()
        chains_fooled = integ["chains_ok"] == integ["chains_total"]
        record("INSIDER_REWRITE", "ভেতরের লোকের ইতিহাস বদল", "Insider rewrites history",
               "চাবিসহ একজন কর্মকর্তা ট্রিগার সরিয়ে পুরো ইতিহাস নতুন করে সাইন করল",
               "An insider with the office key removed the guards and re-signed the whole history",
               not integ["anchors"]["ok"],
               "পাবলিক অ্যাংকর: প্রকাশিত Merkle root আর মিলছে না", "Public anchor: the published Merkle root no longer matches",
               ("chain still looks valid; " if chains_fooled else "") + f"anchor ok = {integ['anchors']['ok']}", outcome="DETECTED")
        clone.close()
        return results

    def _rewrite_history(self, plot_id, from_seq, new_to):
        """LAB ONLY: what a key-holding insider could do after dropping the DB triggers."""
        blocks = self._blocks(plot_id, with_doc=True)
        plot = self._plot(plot_id)
        prev = blocks[from_seq - 2]["hash"] if from_seq > 1 else GENESIS
        prev_to = blocks[from_seq - 2]["to"] if from_seq > 1 else None
        for b in blocks[from_seq - 1:]:
            if b["seq"] == from_seq:
                b["to"] = new_to
            else:
                b["frm"] = prev_to
            b["doc"] = make_document(plot_id, plot["mouza"], plot["area_decimal"], b["kind"], b["deed_no"],
                                     b["frm"], b["to"], b["price_bdt"], b["ts"], b["office_id"])
            b["doc_hash"], b["prev"] = sha256(b["doc"]), prev
            b["hash"] = chain.block_hash(b)
            b["sig"] = self.keyring.sign(b["office_id"], b["hash"])
            self.con.execute('UPDATE blocks SET frm=?,"to"=?,doc=?,doc_hash=?,prev=?,hash=?,sig=? WHERE id=?',
                             (b["frm"], b["to"], b["doc"], b["doc_hash"], b["prev"], b["hash"], b["sig"], b["id"]))
            prev, prev_to = b["hash"], b["to"]
        self.con.execute("UPDATE plots SET owner=? WHERE plot_id=?", (prev_to, plot_id))
        self.con.commit()
