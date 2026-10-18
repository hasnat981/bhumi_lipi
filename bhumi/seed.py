"""Synthetic demo data. NO real names, NID numbers, phone numbers or land records.

Every plot tells one story, so every demo beat is one click:

  DHK-UTT-0142  clean single owner ............................ GREEN
  DHK-UTT-0143  two normal sales (sets the Uttara price level)  GREEN
  CTG-SAD-0877  one clean transfer ............................ GREEN
  DHK-GUL-0309  sold yesterday, mutation pending (locked) ..... AMBER, second sale blocked
  DHK-MIR-0451  clean, but a fake-seller attempt was caught ... GREEN + alert
  CTG-PAT-0120  three transfers in 30 days .................... AMBER (rapid transfer)
  RAJ-BOG-0066  court case pending ............................ AMBER
  RAJ-NAT-0418  area does not match across CS/SA/RS/BS ........ AMBER
  KHL-DUM-0033  khas (government) land ........................ RED
  DHK-SAV-0505  land under acquisition ........................ RED
  SYL-ZKJ-0210  mortgaged to a bank (lien) .................... RED
"""
import hashlib
import json

from . import mutation
from .service import ApiError, Service

DAY = 86400
G = "Government (Khas)"


def seed(svc: Service) -> None:
    con, now = svc.con, svc.now()

    def plot(pid, mouza, area, owner, days_ago, **flags):
        con.execute("INSERT INTO plots(plot_id,mouza,owner,locked,area_decimal,khas,acquisition,court_case)"
                    " VALUES(?,?,?,?,?,?,?,?)",
                    (pid, mouza, owner, 0, area, flags.get("khas", 0), flags.get("acquisition", 0), flags.get("court", 0)))
        svc._append_block(pid, "INIT", flags.get("init_from", G), owner, 0, now - days_ago * DAY)

    def sale(pid, buyer, price, days_ago, pending=False):
        owner = svc._plot(pid)["owner"]
        ts = now - int(days_ago * DAY)
        b = svc._append_block(pid, "SALE", owner, buyer, price, ts)
        con.execute("UPDATE plots SET owner=?, locked=? WHERE plot_id=?", (buyer, 1 if pending else 0, pid))
        final = "AUTO_PASSED" if pending else "APPROVED"
        cur = con.execute(
            "INSERT INTO mutations(tracking_id,plot_id,deed_hash,state,checks,created_ts,updated_ts) VALUES(?,?,?,?,?,?,?)",
            ("MUT-" + b["hash"][:8].upper(), pid, b["hash"], final,
             json.dumps(mutation.run_checks([], True), ensure_ascii=False), ts, ts + (3 if pending else 7200)))
        steps = [("SUBMITTED", "registrar", 0), ("AUTO_CHECKING", "system", 1), ("AUTO_PASSED", "system", 2)]
        if not pending:
            steps.append(("APPROVED", "ac_land", 7200))
        for st, who, off in steps:
            con.execute("INSERT INTO mutation_events(mutation_id,state,actor,note,ts) VALUES(?,?,?,?,?)",
                        (cur.lastrowid, st, who, "", ts + off))

    def survey(pid, areas, holders):
        for s, a, h in zip(("CS", "SA", "RS", "BS"), areas, holders):
            con.execute("INSERT INTO survey_records(plot_id,survey,khatian_no,holder,area_decimal) VALUES(?,?,?,?,?)",
                        (pid, s, f"{s}-{int(hashlib.sha256((pid + s).encode()).hexdigest(), 16) % 900 + 100}", h, a))

    with con:
        plot("DHK-UTT-0142", "Uttara (dummy)", 5.0, "Dummy Owner A", 400)
        survey("DHK-UTT-0142", [5.0] * 4, ["Dummy Ancestor 1", "Dummy Ancestor 1", "Dummy Ancestor 2", "Dummy Owner A"])

        plot("DHK-UTT-0143", "Uttara (dummy)", 4.0, "Dummy Owner H", 500)
        sale("DHK-UTT-0143", "Dummy Owner I", 4_800_000, 200)
        sale("DHK-UTT-0143", "Dummy Owner J", 5_000_000, 60)
        survey("DHK-UTT-0143", [4.0] * 4, ["Dummy Ancestor 3", "Dummy Ancestor 3", "Dummy Ancestor 4", "Dummy Owner H"])

        plot("CTG-SAD-0877", "Sadarghat (dummy)", 3.0, "Dummy Owner C", 300)
        sale("CTG-SAD-0877", "Dummy Owner D", 2_700_000, 90)
        survey("CTG-SAD-0877", [3.0] * 4, ["Dummy Ancestor 5", "Dummy Ancestor 5", "Dummy Ancestor 6", "Dummy Owner C"])

        plot("DHK-GUL-0309", "Gulshan (dummy)", 6.0, "Dummy Owner E", 400)
        sale("DHK-GUL-0309", "Dummy Owner F", 12_000_000, 1, pending=True)
        survey("DHK-GUL-0309", [6.0] * 4, ["Dummy Ancestor 7", "Dummy Ancestor 7", "Dummy Ancestor 8", "Dummy Owner E"])

        plot("DHK-MIR-0451", "Mirpur (dummy)", 4.5, "Dummy Owner G", 250)
        survey("DHK-MIR-0451", [4.5] * 4, ["Dummy Ancestor 9", "Dummy Ancestor 9", "Dummy Ancestor 9", "Dummy Owner G"])

        plot("CTG-PAT-0120", "Patenga (dummy)", 2.5, "Dummy Owner P1", 200)
        sale("CTG-PAT-0120", "Dummy Owner P2", 1_500_000, 20)
        sale("CTG-PAT-0120", "Dummy Owner P3", 1_600_000, 12)
        sale("CTG-PAT-0120", "Dummy Owner P4", 1_650_000, 3)
        survey("CTG-PAT-0120", [2.5] * 4, ["Dummy Ancestor 10", "Dummy Ancestor 10", "Dummy Ancestor 11", "Dummy Owner P1"])

        plot("RAJ-BOG-0066", "Bogura (dummy)", 8.0, "Dummy Owner R1", 500, court=1)
        survey("RAJ-BOG-0066", [8.0] * 4, ["Dummy Ancestor 12", "Dummy Ancestor 12", "Dummy Ancestor 13", "Dummy Owner R1"])

        plot("RAJ-NAT-0418", "Natore (dummy)", 5.5, "Dummy Owner T1", 300)
        survey("RAJ-NAT-0418", [5.5, 5.5, 4.2, 5.5], ["Dummy Ancestor 14", "Dummy Ancestor 14", "Dummy Ancestor 15", "Dummy Owner T1"])

        plot("KHL-DUM-0033", "Dumuria (dummy)", 10.0, "Government of Bangladesh (Khas)", 900, khas=1, init_from="Survey Record")
        survey("KHL-DUM-0033", [10.0] * 4, ["Government (Khas)"] * 4)

        plot("DHK-SAV-0505", "Savar (dummy)", 7.0, "Dummy Owner V1", 600, acquisition=1)
        survey("DHK-SAV-0505", [7.0] * 4, ["Dummy Ancestor 16", "Dummy Ancestor 16", "Dummy Ancestor 17", "Dummy Owner V1"])

        plot("SYL-ZKJ-0210", "Zakiganj (dummy)", 3.5, "Dummy Owner S1", 300)
        survey("SYL-ZKJ-0210", [3.5] * 4, ["Dummy Ancestor 18", "Dummy Ancestor 18", "Dummy Ancestor 19", "Dummy Owner S1"])
        con.execute("INSERT INTO liens(plot_id,bank,amount_bdt,ts) VALUES(?,?,?,?)",
                    ("SYL-ZKJ-0210", "Dummy Bank Ltd", 2_500_000, now - 30 * DAY))

    # a caught fraud attempt so the alerts queue is not empty on day one
    try:
        svc.register_sale("registrar", "DHK-MIR-0451", "Fraud Seller X", "Fraud Buyer Y", 3_000_000)
    except ApiError:
        pass
    svc.ensure_anchor()
