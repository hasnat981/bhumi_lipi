import sqlite3
import unittest

from bhumi import chain, db, service
from bhumi.api import build_service
from bhumi.service import ApiError, sha256

MASTER = b"m" * 32


def fresh():
    return build_service(":memory:", master=MASTER, clock=lambda: 1_800_000_000)


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.svc = fresh()

    def sell(self, plot, seller, buyer, price=1_000_000):
        return self.svc.register_sale("registrar", plot, seller, buyer, price)

    # ---- seed + verdicts
    def test_all_seeded_chains_verify(self):
        integ = self.svc.integrity()
        self.assertTrue(integ["healthy"])
        self.assertEqual(integ["chains_ok"], integ["chains_total"])
        self.assertEqual(integ["chains_total"], 11)

    def test_seed_verdicts(self):
        expected = {"DHK-UTT-0142": "green", "DHK-UTT-0143": "green", "CTG-SAD-0877": "green", "DHK-MIR-0451": "green",
                    "DHK-GUL-0309": "amber", "CTG-PAT-0120": "amber", "RAJ-BOG-0066": "amber", "RAJ-NAT-0418": "amber",
                    "KHL-DUM-0033": "red", "DHK-SAV-0505": "red", "SYL-ZKJ-0210": "red"}
        for plot, verdict in expected.items():
            self.assertEqual(self.svc.check_plot(plot)["verdict"], verdict, plot)

    def test_verdict_texts_are_bilingual(self):
        r = self.svc.check_plot("DHK-GUL-0309")
        self.assertTrue(r["headline"]["bn"] and r["headline"]["en"])
        self.assertTrue(all(x["bn"] and x["en"] for x in r["reasons"] + r["advice"]))

    def test_unknown_and_malformed_plot(self):
        with self.assertRaises(ApiError) as e:
            self.svc.check_plot("DHK-XXX-9999")
        self.assertEqual(e.exception.status, 404)
        with self.assertRaises(ApiError) as e:
            self.svc.check_plot("../etc/passwd")
        self.assertEqual(e.exception.code, "BAD_PLOT")

    # ---- the core lifecycle
    def test_full_lifecycle_sale_lock_block_approve_resell(self):
        r = self.sell("DHK-UTT-0142", "Dummy Owner A", "Dummy Buyer B", 6_000_000)
        self.assertEqual(r["mutation_state"], "AUTO_PASSED")
        self.assertTrue(self.svc.check_plot("DHK-UTT-0142")["plot"]["locked"])
        with self.assertRaises(ApiError) as e:  # second sale while locked
            self.sell("DHK-UTT-0142", "Dummy Buyer B", "Dummy Buyer C")
        self.assertEqual(e.exception.status, 409)
        self.assertIn("LOCKED", {f["code"] for f in e.exception.extra["flags"]})
        done = self.svc.decide("ac_land", r["tracking_id"], "approve")
        self.assertEqual(done["state"], "APPROVED")
        self.assertFalse(self.svc.check_plot("DHK-UTT-0142")["plot"]["locked"])
        self.sell("DHK-UTT-0142", "Dummy Buyer B", "Dummy Buyer C", 6_100_000)  # allowed now
        self.assertTrue(self.svc.integrity()["healthy"])

    def test_fake_seller_blocked_and_alerted(self):
        before = len(self.svc.alerts())
        with self.assertRaises(ApiError) as e:
            self.sell("DHK-UTT-0142", "Fraud X", "Fraud Y")
        self.assertIn("NOT_OWNER", {f["code"] for f in e.exception.extra["flags"]})
        self.assertGreater(len(self.svc.alerts()), before)
        self.assertEqual(self.svc.check_plot("DHK-UTT-0142")["plot"]["owner"], "Dummy Owner A")

    def test_government_lien_and_missing_plot_blocked(self):
        for plot, seller in (("KHL-DUM-0033", "Government of Bangladesh (Khas)"), ("DHK-SAV-0505", "Dummy Owner V1"),
                             ("SYL-ZKJ-0210", "Dummy Owner S1")):
            with self.assertRaises(ApiError, msg=plot):
                self.sell(plot, seller, "Someone Else")
        with self.assertRaises(ApiError):
            self.sell("DHK-ZZZ-0001", "A B", "C D")

    def test_price_anomaly_goes_to_officer_review(self):
        r = self.sell("DHK-UTT-0142", "Dummy Owner A", "Dummy Buyer B", 500_000)
        self.assertEqual(r["mutation_state"], "FLAGGED")
        self.assertIn("PRICE_ANOMALY", {f["code"] for f in r["flags"]})
        with self.assertRaises(ApiError) as e:  # reason is required for flagged approvals
            self.svc.decide("ac_land", r["tracking_id"], "approve")
        self.assertEqual(e.exception.code, "NOTE_REQUIRED")
        self.svc.decide("ac_land", r["tracking_id"], "approve", "Price checked, family transfer")

    def test_reject_appends_reversal_and_restores_owner(self):
        r = self.sell("DHK-UTT-0142", "Dummy Owner A", "Dummy Buyer B", 5_900_000)
        self.svc.decide("ac_land", r["tracking_id"], "reject", "Documents incomplete")
        c = self.svc.check_plot("DHK-UTT-0142")
        self.assertEqual(c["plot"]["owner"], "Dummy Owner A")
        self.assertEqual([b["kind"] for b in c["history"]], ["INIT", "SALE", "REVERSAL"])
        self.assertTrue(c["chain"]["ok"])
        self.assertEqual(self.svc.verify(hash_value=r["hash"])["result"], "OUTDATED")

    def test_decision_cannot_be_repeated(self):
        r = self.sell("DHK-UTT-0142", "Dummy Owner A", "Dummy Buyer B", 5_900_000)
        self.svc.decide("ac_land", r["tracking_id"], "approve")
        with self.assertRaises(ApiError) as e:
            self.svc.decide("ac_land", r["tracking_id"], "reject", "late")
        self.assertEqual(e.exception.code, "BAD_STATE")

    def test_dry_run_changes_nothing(self):
        n = self.svc.integrity()["blocks"]
        r = self.svc.register_sale("registrar", "DHK-UTT-0142", "Dummy Owner A", "B C", 5_000_000, dry_run=True)
        self.assertTrue(r["allowed"])
        self.assertEqual(self.svc.integrity()["blocks"], n)

    def test_input_validation(self):
        for args in (("DHK-UTT-0142", "", "B C", 1), ("DHK-UTT-0142", "A B", "x" * 200, 1),
                     ("DHK-UTT-0142", "A B", "C D", "abc"), ("DHK-UTT-0142", "A B", "C D", -5), ("nope", "A B", "C D", 1)):
            with self.assertRaises(ApiError):
                self.svc.register_sale("registrar", *args)

    # ---- verify
    def test_verify_genuine_outdated_forged_and_file(self):
        h = self.svc.check_plot("DHK-UTT-0143")["history"]
        self.assertEqual(self.svc.verify(hash_value=h[-1]["hash"])["result"], "GENUINE")
        self.assertEqual(self.svc.verify(hash_value=h[1]["hash"])["result"], "OUTDATED")
        self.assertEqual(self.svc.verify(hash_value="0" * 64)["result"], "FORGED")
        doc = self.svc.deed_by_hash(h[-1]["hash"])["doc"]
        self.assertEqual(self.svc.verify(doc_hash=sha256(doc))["result"], "GENUINE")
        self.assertEqual(self.svc.verify(doc_hash=sha256(doc.replace("BDT", "BDT 9")))["result"], "FORGED")
        self.assertEqual(self.svc.verify(hash_value="https://x.example/#/v/" + h[-1]["hash"])["result"], "GENUINE")
        with self.assertRaises(ApiError):
            self.svc.verify(hash_value="not a code")

    # ---- liens
    def test_lien_flow_and_double_mortgage(self):
        lien = self.svc.place_lien("bank", "DHK-UTT-0142", "Dummy Bank Ltd", 3_000_000)
        self.assertEqual(self.svc.check_plot("DHK-UTT-0142")["verdict"], "red")
        with self.assertRaises(ApiError) as e:
            self.svc.place_lien("bank", "DHK-UTT-0142", "Other Bank", 1_000_000)
        self.assertEqual(e.exception.code, "DOUBLE_MORTGAGE")
        with self.assertRaises(ApiError):
            self.sell("DHK-UTT-0142", "Dummy Owner A", "B C")
        self.svc.release_lien("bank", lien["id"])
        self.assertEqual(self.svc.check_plot("DHK-UTT-0142")["verdict"], "green")
        with self.assertRaises(ApiError):  # cannot mortgage a locked plot
            self.svc.place_lien("bank", "DHK-GUL-0309", "Dummy Bank Ltd", 1)

    # ---- tamper detection (what happens when someone edits the data anyway)
    def _unguard(self):
        for name in db.TRIGGER_NAMES:
            self.svc.con.execute(f"DROP TRIGGER IF EXISTS {name}")

    def test_triggers_block_edits(self):
        for sql in ('UPDATE blocks SET "to"=\'x\' WHERE id=1', "DELETE FROM blocks WHERE id=1", "UPDATE anchors SET merkle_root='x'"):
            with self.assertRaises(sqlite3.DatabaseError, msg=sql):
                self.svc.con.execute(sql)

    def test_chain_guard_rejects_fork(self):
        with self.assertRaises(sqlite3.DatabaseError):
            self.svc.con.execute('INSERT INTO blocks(plot_id,seq,kind,deed_no,frm,"to",ts,doc_hash,doc,price_bdt,office_id,prev,hash,sig)'
                                 " VALUES('DHK-UTT-0142',9,'SALE','x','a','b',1,'d','doc',1,'SR-DHK','wrong','hh','ss')")

    def test_edited_row_is_detected_by_chain_check(self):
        self._unguard()
        self.svc.con.execute('UPDATE blocks SET "to"=\'Fraud\' WHERE plot_id=\'CTG-SAD-0877\' AND seq=2')
        r = self.svc.verify_plot_chain("CTG-SAD-0877")
        self.assertFalse(r["ok"]); self.assertEqual(r["first_bad_seq"], 2)
        self.assertEqual(self.svc.check_plot("CTG-SAD-0877")["verdict"], "red")
        self.assertFalse(self.svc.integrity()["healthy"])

    def test_edited_document_is_detected(self):
        self._unguard()
        self.svc.con.execute("UPDATE blocks SET doc=replace(doc,'BDT','BDT 9') WHERE plot_id='CTG-SAD-0877' AND seq=2")
        self.assertEqual(self.svc.verify_plot_chain("CTG-SAD-0877")["reason"], "DOCUMENT")

    def test_rewrite_with_key_is_caught_by_anchor(self):
        self.svc.ensure_anchor()
        self._unguard()
        self.svc._rewrite_history("CTG-SAD-0877", 2, "Fraud Buyer")
        integ = self.svc.integrity()
        self.assertEqual(integ["chains_ok"], integ["chains_total"])  # re-signed chain looks fine ...
        self.assertFalse(integ["anchors"]["ok"])                      # ... but the public anchor does not match
        self.assertFalse(integ["healthy"])

    # ---- anchor + export
    def test_anchor_proof_verifies(self):
        h = self.svc.check_plot("CTG-PAT-0120")["history"][2]["hash"]
        p = self.svc.anchor_proof(h)
        self.assertTrue(chain.verify_proof(p["leaf"], p["proof"], p["root"]))
        self.assertEqual(p["root"], self.svc.ensure_anchor()["merkle_root"])

    def test_anchor_snapshots_grow_with_new_blocks(self):
        a = self.svc.ensure_anchor()
        self.sell("DHK-UTT-0142", "Dummy Owner A", "Dummy Buyer B", 6_000_000)
        b = self.svc.ensure_anchor()
        self.assertGreater(b["block_count"], a["block_count"])
        self.assertTrue(self.svc.integrity()["anchors"]["ok"])

    def test_export_is_independently_verifiable(self):
        ex = self.svc.export()
        for b in ex["blocks"]:
            self.assertEqual(chain.block_hash(b), b["hash"])
            self.assertTrue(chain.verify_signature(ex["keys"][b["office_id"]], b["hash"], b["sig"]))
            self.assertEqual(sha256(b["doc"]), b["doc_hash"])

    # ---- lab
    def test_lab_stops_all_five_attacks_and_leaves_live_data_alone(self):
        n = self.svc.integrity()["blocks"]
        res = self.svc.lab_run()
        self.assertEqual([r["id"] for r in res], ["FAKE_SELLER", "DOUBLE_SALE", "FORGED_FILE", "DB_EDIT", "INSIDER_REWRITE"])
        self.assertTrue(all(r["stopped"] for r in res), res)
        self.assertEqual([r["outcome"] for r in res], ["STOPPED"] * 4 + ["DETECTED"])  # the insider attack is caught, not prevented
        self.assertEqual(self.svc.integrity()["blocks"], n)
        self.assertTrue(self.svc.integrity()["healthy"])


if __name__ == "__main__":
    unittest.main()


class MutationAgingTests(unittest.TestCase):
    def test_waiting_days_and_colour(self):
        now = [1_800_000_000]
        svc = build_service(":memory:", master=MASTER, clock=lambda: now[0])
        r = svc.register_sale("registrar", "DHK-UTT-0142", "Dummy Owner A", "Dummy Buyer B", 6_000_000)
        m = svc.mutation_status(r["tracking_id"])
        self.assertEqual((m["waiting_days"], m["aging"]), (0, "green"))
        now[0] += 13 * 86400 + 5
        self.assertEqual(svc.mutation_status(r["tracking_id"])["aging"], "green")
        now[0] += 86400
        self.assertEqual((svc.mutation_status(r["tracking_id"])["waiting_days"], svc.mutation_status(r["tracking_id"])["aging"]), (14, "amber"))
        now[0] += 16 * 86400
        self.assertEqual(svc.mutation_status(r["tracking_id"])["aging"], "red")
        done = svc.decide("ac_land", r["tracking_id"], "approve")
        self.assertIsNone(done["aging"])               # decided applications have no warning colour
        self.assertEqual(done["waiting_days"], 30)     # but we still show how long it took
        now[0] += 10 * 86400
        self.assertEqual(svc.mutation_status(r["tracking_id"])["waiting_days"], 30)  # does not keep growing


class VerifierScriptTests(unittest.TestCase):
    """The standalone tools/verify_anchor.py must agree with the app, and must catch tampering."""

    def run_tool(self, export):
        import json, os, subprocess, sys, tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
            json.dump(export, f, ensure_ascii=False)
        try:
            root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            return subprocess.run([sys.executable, os.path.join(root, "tools", "verify_anchor.py"), f.name],
                                  capture_output=True, text=True)
        finally:
            os.unlink(f.name)

    def test_clean_export_passes(self):
        r = self.run_tool(fresh().export())
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("OK", r.stdout)

    def test_tampered_export_fails(self):
        ex = fresh().export()
        ex["blocks"][3]["to"] = "Fraud"
        r = self.run_tool(ex)
        self.assertEqual(r.returncode, 1)
        self.assertIn("PROBLEMS", r.stdout)

    def test_rewritten_history_fails_only_on_anchor(self):
        svc = fresh()
        svc.ensure_anchor()
        for name in db.TRIGGER_NAMES:
            svc.con.execute(f"DROP TRIGGER IF EXISTS {name}")
        svc._rewrite_history("CTG-SAD-0877", 2, "Fraud Buyer")
        r = self.run_tool(svc.export())
        self.assertEqual(r.returncode, 1)
        self.assertIn("anchor", r.stdout)
        self.assertNotIn("bad signature", r.stdout)
