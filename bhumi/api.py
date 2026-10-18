"""HTTP layer. Python standard library only (http.server): one dependency in total
(`cryptography`), small attack surface, easy to audit and to explain.

Serves the JSON API under /api and the static web app (web/) for everything else.

Demo roles: send header X-Demo-Role: citizen | registrar | ac_land | bank.
This is NOT real authentication. Production would use national digital ID, per-office
hardware keys and audit review (see docs/THREAT_MODEL.md).
"""
import hashlib
import json
import mimetypes
import os
import re
import sys
import time
import traceback
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

from . import ai
from . import chain
from . import db as dbmod
from .seed import seed
from .service import ApiError, Service

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "web")
TOOLS = os.path.join(ROOT, "tools")
MAX_BODY = 64 * 1024
ROLES = {"citizen", "registrar", "ac_land", "bank"}

mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("image/svg+xml", ".svg")

CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; "
       "object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'")


class Raw:
    def __init__(self, body: bytes, ctype: str, status=200, headers=None):
        self.body, self.ctype, self.status, self.headers = body, ctype, status, headers or {}


class Limiter:
    """Sliding-window rate limit per client. Protects write endpoints from flooding."""

    def __init__(self):
        self.hits = defaultdict(deque)

    def allow(self, key: str, limit: int, window=60) -> bool:
        now, q = time.time(), self.hits[key]
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= limit:
            return False
        q.append(now)
        return True


class Ctx:
    def __init__(self, svc, role, ip_hash, body, query):
        self.svc, self.role, self.ip_hash, self.body, self.query = svc, role, ip_hash, body, query

    def need(self, *roles):
        if self.role not in roles:
            names = {"registrar": "সাব-রেজিস্ট্রার / Sub-registrar", "ac_land": "এসি ল্যান্ড / AC Land", "bank": "ব্যাংক / Bank"}
            raise ApiError(403, "FORBIDDEN", "এই কাজের জন্য সঠিক ভূমিকা বেছে নিন: " + ", ".join(names[r].split(" / ")[0] for r in roles),
                           "Choose the right role for this action: " + ", ".join(names[r].split(" / ")[1] for r in roles))


def _doc_response(svc, h):
    d = svc.deed_by_hash(h)
    name = f"{d['deed_no']}.txt"
    return Raw(d["doc"].encode("utf-8"), "text/plain; charset=utf-8",
               headers={"Content-Disposition": f'attachment; filename="{name}"'})


def _deed_public(svc, h):
    d = svc.deed_by_hash(h)
    d.pop("doc", None)
    return d


def _bad_body(c):
    if not isinstance(c.body, dict):
        raise ApiError(400, "BAD_JSON", "অনুরোধের ধরন ঠিক নেই।", "Request body must be a JSON object.")
    return c.body


def _sale(c, dry):
    c.need("registrar")
    b = _bad_body(c)
    return c.svc.register_sale(c.role, b.get("plot_id"), b.get("seller"), b.get("buyer"), b.get("price_bdt", 0),
                               dry_run=dry, ip_hash=c.ip_hash)


# (method, regex, handler(ctx, *groups), write?)
ROUTES = [
    ("GET", r"/api/health", lambda c: {"ok": True}, False),
    ("GET", r"/api/plots", lambda c: c.svc.list_plots(), False),
    ("GET", r"/api/plots/([^/]+)", lambda c, p: c.svc.check_plot(unquote(p)), False),
    ("GET", r"/api/stats", lambda c: c.svc.stats(), False),
    ("POST", r"/api/risk", lambda c: _sale(c, True), True),
    ("POST", r"/api/deeds", lambda c: _sale(c, False), True),
    ("GET", r"/api/deeds/([0-9a-fA-F]{64})/document", lambda c, h: _doc_response(c.svc, h), False),
    ("GET", r"/api/deeds/([0-9a-fA-F]{64})", lambda c, h: _deed_public(c.svc, h), False),
    ("POST", r"/api/verify", lambda c: c.svc.verify(hash_value=_bad_body(c).get("hash"), doc_hash=c.body.get("doc_hash")), True),
    ("GET", r"/api/mutations/queue", lambda c: (c.need("ac_land", "registrar"), c.svc.mutation_queue())[1], False),
    ("GET", r"/api/mutations/([^/]+)", lambda c, t: c.svc.mutation_status(unquote(t)), False),
    ("POST", r"/api/mutations/([^/]+)/decision",
     lambda c, t: (c.need("ac_land"), c.svc.decide(c.role, unquote(t), _bad_body(c).get("decision"), c.body.get("note", ""), c.ip_hash))[1], True),
    ("GET", r"/api/liens", lambda c: c.svc.list_liens((c.query.get("plot") or [None])[0]), False),
    ("POST", r"/api/liens",
     lambda c: (c.need("bank"), c.svc.place_lien(c.role, _bad_body(c).get("plot_id"), c.body.get("bank"), c.body.get("amount_bdt", 0), c.ip_hash))[1], True),
    ("POST", r"/api/liens/(\d+)/release", lambda c, i: (c.need("bank"), c.svc.release_lien(c.role, int(i), c.ip_hash))[1], True),
    ("GET", r"/api/integrity", lambda c: c.svc.integrity(), False),
    ("GET", r"/api/anchor", lambda c: c.svc.ensure_anchor(), False),
    ("GET", r"/api/anchor/proof/([0-9a-fA-F]{64})", lambda c, h: c.svc.anchor_proof(h), False),
    ("GET", r"/api/export", lambda c: c.svc.export(), False),
    ("GET", r"/api/keys", lambda c: c.svc.keys(), False),
    ("GET", r"/api/alerts", lambda c: (c.need("registrar", "ac_land", "bank"), c.svc.alerts())[1], False),
    ("POST", r"/api/lab/run", lambda c: c.svc.lab_run(), True),
]
COMPILED = [(m, re.compile(f"^{p}$"), h, w) for m, p, h, w in ROUTES]


def make_handler(svc: Service, limiter: Limiter):
    salt = os.environ.get("BHUMI_IP_SALT", "bhumi-demo-salt")

    class Handler(BaseHTTPRequestHandler):
        server_version = "BhumiLipi/1.0"
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt, *args):
            if os.environ.get("BHUMI_LOG"):
                sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))

        # -------------------------------------------------- plumbing
        def _send(self, status, body: bytes, ctype, extra=None):
            self.send_response(status)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Permissions-Policy", "camera=(self), microphone=(), geolocation=()")
            self.send_header("Content-Security-Policy", CSP)
            self.send_header("Cache-Control", "no-store" if self.path.startswith("/api/") else "no-cache")
            for k, v in (extra or {}).items():
                self.send_header(k, v)
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)

        def _json(self, status, obj):
            self._send(status, json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

        def _client_ip(self):
            fwd = self.headers.get("X-Forwarded-For", "")
            return (fwd.split(",")[0].strip() if fwd else self.client_address[0]) or "?"

        # -------------------------------------------------- dispatch
        def do_GET(self):
            self._handle("GET")

        def do_POST(self):
            self._handle("POST")

        def do_HEAD(self):
            self._handle("GET")

        def _handle(self, method):
            url = urlparse(self.path)
            path = url.path
            try:
                if path in ("/healthz", "/health"):
                    return self._json(200, {"ok": True})
                if path.startswith("/api/"):
                    return self._api(method, path, parse_qs(url.query))
                if method != "GET":
                    return self._json(405, {"error": {"code": "METHOD", "bn": "এই পদ্ধতি চলবে না।", "en": "Method not allowed."}})
                return self._static(path)
            except (BrokenPipeError, ConnectionResetError):
                pass
            except Exception:
                traceback.print_exc()
                self._json(500, {"error": {"code": "SERVER", "bn": "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
                                           "en": "Something went wrong on the server. Please try again."}})

        def _ai(self, method, path, ip_hash):
            """AI assistant. Kept outside the service lock: the Gemini call can take seconds and must
            not block other visitors. Only reads the registry; never writes."""
            if method == "GET" and path == "/api/ai/status":
                return self._json(200, {"enabled": ai.enabled()})
            if method != "POST" or path != "/api/ai/ask":
                return self._json(404, {"error": {"code": "NOT_FOUND", "bn": "পাওয়া যায়নি।", "en": "Not found."}})
            if not limiter.allow(ip_hash + ":ai", 12):
                return self._json(429, {"error": {"code": "RATE", "bn": "অনেক বেশি প্রশ্ন। এক মিনিট পরে চেষ্টা করুন।",
                                                  "en": "Too many questions. Please try again in a minute."}})
            n = int(self.headers.get("Content-Length") or 0)
            if n > MAX_BODY:
                return self._json(413, {"error": {"code": "TOO_BIG", "bn": "অনুরোধ অনেক বড়।", "en": "Request too large."}})
            try:
                body = json.loads(self.rfile.read(n) or b"{}") if n else {}
            except ValueError:
                body = None
            if not isinstance(body, dict):
                return self._json(400, {"error": {"code": "BAD_JSON", "bn": "অনুরোধের ধরন ঠিক নেই।", "en": "Request body is not valid JSON."}})
            q = body.get("question")
            q = q.strip() if isinstance(q, str) else ""
            if not q or len(q) > ai.MAX_QUESTION:
                return self._json(400, {"error": {"code": "BAD_QUESTION", "bn": f"প্রশ্ন লিখুন (সর্বোচ্চ {ai.MAX_QUESTION} অক্ষর)।",
                                                  "en": f"Write a question (max {ai.MAX_QUESTION} characters)."}})
            ids = ai.plot_ids_in(q)
            sel = body.get("plot_id")
            if isinstance(sel, str) and sel.strip() and sel.strip().upper() not in ids:
                ids.insert(0, sel.strip().upper())
            try:
                facts = []
                for pid in ids[:2]:
                    try:
                        facts.append(ai.describe_plot(svc.check_plot(pid)))
                    except ApiError:
                        facts.append(f"প্লট {pid[:20]} রেজিস্ট্রিতে পাওয়া যায়নি।")
                return self._json(200, {"answer": ai.ask(q, facts, body.get("history")), "plots": ids[:2]})
            except ai.AiError as e:
                return self._json(e.status, e.body())

        def _api(self, method, path, query):
            ip_hash = hashlib.sha256((self._client_ip() + salt).encode()).hexdigest()[:12]
            role = self.headers.get("X-Demo-Role", "citizen")
            role = role if role in ROLES else "citizen"
            if path.startswith("/api/ai/"):
                return self._ai(method, path, ip_hash)
            for m, rx, handler, write in COMPILED:
                match = rx.match(path)
                if m == method and match:
                    if write and not limiter.allow(ip_hash + (":lab" if "lab" in path else ""), 6 if "lab" in path else 90):
                        return self._json(429, {"error": {"code": "RATE", "bn": "অনেক বেশি অনুরোধ। একটু পরে চেষ্টা করুন।",
                                                          "en": "Too many requests. Please try again shortly."}})
                    body = None
                    if method == "POST":
                        n = int(self.headers.get("Content-Length") or 0)
                        if n > MAX_BODY:
                            return self._json(413, {"error": {"code": "TOO_BIG", "bn": "অনুরোধ অনেক বড়।", "en": "Request too large."}})
                        raw = self.rfile.read(n) if n else b"{}"
                        try:
                            body = json.loads(raw or b"{}")
                        except ValueError:
                            return self._json(400, {"error": {"code": "BAD_JSON", "bn": "অনুরোধের ধরন ঠিক নেই।", "en": "Request body is not valid JSON."}})
                    try:
                        with svc.lock:  # one request at a time touches the shared SQLite connection
                            result = handler(Ctx(svc, role, ip_hash, body, query), *match.groups())
                    except ApiError as e:
                        return self._json(e.status, e.body())
                    if isinstance(result, Raw):
                        return self._send(result.status, result.body, result.ctype, result.headers)
                    return self._json(200, result)
            self._json(404, {"error": {"code": "NOT_FOUND", "bn": "পাওয়া যায়নি।", "en": "Not found."}})

        def _static(self, path):
            if path == "/tools/verify_anchor.py":
                base, rel = TOOLS, "verify_anchor.py"
            else:
                base, rel = WEB, unquote(path).lstrip("/") or "index.html"
            full = os.path.realpath(os.path.join(base, rel))
            if not full.startswith(os.path.realpath(base) + os.sep) or not os.path.isfile(full):
                # single-page app: unknown paths without a file extension show the app
                if "." in os.path.basename(path):
                    return self._json(404, {"error": {"code": "NOT_FOUND", "bn": "পাওয়া যায়নি।", "en": "Not found."}})
                full = os.path.join(WEB, "index.html")
            ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
            if ctype.startswith("text/") or ctype in ("application/javascript", "image/svg+xml"):
                ctype += "; charset=utf-8"
            with open(full, "rb") as f:
                self._send(200, f.read(), ctype)

    return Handler


# ---------------------------------------------------------------- startup
def build_service(db_path=":memory:", master=None, clock=None, strict=False) -> Service:
    """Create the service. If the signing keys changed since the database was created
    (for example a free host restarted with a new random key) the demo database is rebuilt,
    unless strict mode is on."""
    keyring = chain.Keyring(master or chain.load_master())
    fp = chain.sha256_hex(keyring.public_b64("SR-DHK"))
    con = dbmod.connect(db_path)
    svc = Service(con, keyring, clock)
    stored = svc._one("SELECT v FROM meta WHERE k='key_fp'")
    if svc.has_data() and (stored is None or stored["v"] != fp):
        if strict:
            raise SystemExit("Signing keys changed since this database was created. Refusing to start (strict mode).")
        con.close()
        if db_path != ":memory:" and os.path.exists(db_path):
            os.remove(db_path)
        con = dbmod.connect(db_path)
        svc = Service(con, keyring, clock)
    if not svc.has_data():
        seed(svc)
        with con:
            con.execute("INSERT OR REPLACE INTO meta(k,v) VALUES('key_fp',?)", (fp,))
    return svc


def make_server(svc: Service, host="127.0.0.1", port=8000) -> ThreadingHTTPServer:
    httpd = ThreadingHTTPServer((host, port), make_handler(svc, Limiter()))
    httpd.daemon_threads = True
    return httpd


def get_host_port():
    host = os.environ.get("HOST") or "0.0.0.0"
    raw_port = (os.environ.get("PORT") or "").strip()
    try:
        port = int(raw_port) if raw_port else 8000
    except ValueError:
        port = 8000
    return host, port


def main():
    db_path = os.environ.get("BHUMI_DB", os.path.join(ROOT, "data", "bhumi.db"))
    if db_path != ":memory:":
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
    svc = build_service(db_path, strict=bool(os.environ.get("BHUMI_STRICT")))
    host, port = get_host_port()
    httpd = make_server(svc, host, port)
    print(f"ভূমি লিপি / Bhumi Lipi running on http://{host}:{port}  (demo data only)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("bye")
