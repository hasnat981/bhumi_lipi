"""End-to-end over real HTTP: starts the server on a random port and calls it like a browser would."""
import json
import os
import threading
import unittest
import unittest.mock
import urllib.error
import urllib.request

from bhumi.api import build_service, make_server, get_host_port

MASTER = b"m" * 32


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = make_server(build_service(":memory:", master=MASTER), "127.0.0.1", 0)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()

    def call(self, method, path, body=None, role="citizen", raw=False):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method,
                                     headers={"Content-Type": "application/json", "X-Demo-Role": role})
        try:
            with urllib.request.urlopen(req) as r:
                payload = r.read()
                return r.status, (payload if raw else json.loads(payload)), r.headers
        except urllib.error.HTTPError as e:
            payload = e.read()
            return e.code, (payload if raw else json.loads(payload)), e.headers

    def test_static_app_and_security_headers(self):
        s, body, h = self.call("GET", "/", raw=True)
        self.assertEqual(s, 200); self.assertIn(b"id=\"main\"", body)
        self.assertIn("default-src 'self'", h["Content-Security-Policy"])
        self.assertEqual(h["X-Content-Type-Options"], "nosniff")
        s, body, _ = self.call("GET", "/check/DHK-UTT-0142", raw=True)  # SPA fallback
        self.assertEqual(s, 200)
        self.assertEqual(self.call("GET", "/js/nope.js")[0], 404)

    def test_no_path_traversal(self):
        s, _, _ = self.call("GET", "/..%2f..%2fbhumi%2fservice.py", raw=True)
        self.assertNotEqual(s, 200)
        s, body, _ = self.call("GET", "/%2e%2e/bhumi/service.py", raw=True)
        self.assertNotIn(b"class Service", body)

    def test_citizen_check_and_unknown(self):
        s, b, _ = self.call("GET", "/api/plots/DHK-GUL-0309")
        self.assertEqual((s, b["verdict"]), (200, "amber"))
        self.assertEqual(self.call("GET", "/api/plots/DHK-ABC-0000")[0], 404)
        self.assertEqual(self.call("GET", "/api/plots/bad")[0], 400)

    def test_roles_are_enforced(self):
        sale = {"plot_id": "DHK-UTT-0142", "seller": "Dummy Owner A", "buyer": "B C", "price_bdt": 6000000}
        self.assertEqual(self.call("POST", "/api/deeds", sale, role="citizen")[0], 403)
        self.assertEqual(self.call("POST", "/api/mutations/MUT-X/decision", {"decision": "approve"}, role="registrar")[0], 403)
        self.assertEqual(self.call("GET", "/api/alerts", role="citizen")[0], 403)
        self.assertEqual(self.call("POST", "/api/liens", {"plot_id": "DHK-UTT-0142", "bank": "X Y", "amount_bdt": 1}, role="registrar")[0], 403)

    def test_bad_input_and_big_body(self):
        self.assertEqual(self.call("POST", "/api/deeds", {"plot_id": 5}, role="registrar")[0], 400)
        req = urllib.request.Request(self.base + "/api/verify", data=b"{not json", method="POST")
        with self.assertRaises(urllib.error.HTTPError) as e:
            urllib.request.urlopen(req)
        self.assertEqual(e.exception.code, 400)
        req = urllib.request.Request(self.base + "/api/verify", data=b"x" * 70000, method="POST",
                                     headers={"Content-Length": "70000"})
        with self.assertRaises((urllib.error.HTTPError, ConnectionError, OSError)):
            urllib.request.urlopen(req)

    def test_whole_demo_story_over_http(self):
        plot = "DHK-UTT-0143"
        owner = self.call("GET", f"/api/plots/{plot}")[1]["plot"]["owner"]
        sale = {"plot_id": plot, "seller": owner, "buyer": "Dummy Buyer Q", "price_bdt": 5_200_000}
        s, risk, _ = self.call("POST", "/api/risk", sale, role="registrar")
        self.assertEqual((s, risk["allowed"]), (200, True))
        s, deed, _ = self.call("POST", "/api/deeds", sale, role="registrar")
        self.assertEqual(s, 200); self.assertTrue(deed["hash"])
        # citizen sees amber; second sale is blocked with bilingual reasons
        self.assertEqual(self.call("GET", f"/api/plots/{plot}")[1]["verdict"], "amber")
        s, err, _ = self.call("POST", "/api/deeds", {**sale, "seller": "Dummy Buyer Q", "buyer": "Z Z"}, role="registrar")
        self.assertEqual(s, 409); self.assertTrue(err["error"]["flags"][0]["bn"])
        # verify by seal, by file, forged file
        self.assertEqual(self.call("POST", "/api/verify", {"hash": deed["hash"]})[1]["result"], "GENUINE")
        s, doc, h = self.call("GET", f"/api/deeds/{deed['hash']}/document", raw=True)
        self.assertEqual(s, 200); self.assertIn("attachment", h["Content-Disposition"])
        import hashlib
        self.assertEqual(self.call("POST", "/api/verify", {"doc_hash": hashlib.sha256(doc).hexdigest()})[1]["result"], "GENUINE")
        forged = hashlib.sha256(doc.replace(b"Dummy Buyer Q", b"Dummy Buyer R")).hexdigest()
        self.assertEqual(self.call("POST", "/api/verify", {"doc_hash": forged})[1]["result"], "FORGED")
        # tracker + officer queue + approval
        self.assertEqual(self.call("GET", f"/api/mutations/{deed['tracking_id']}")[1]["state"], "AUTO_PASSED")
        q = self.call("GET", "/api/mutations/queue", role="ac_land")[1]
        self.assertIn(deed["tracking_id"], [m["tracking_id"] for m in q])
        s, done, _ = self.call("POST", f"/api/mutations/{deed['tracking_id']}/decision", {"decision": "approve"}, role="ac_land")
        self.assertEqual((s, done["state"]), (200, "APPROVED"))
        self.assertEqual(self.call("GET", f"/api/plots/{plot}")[1]["plot"]["locked"], False)
        # integrity + anchor + proof
        integ = self.call("GET", "/api/integrity")[1]
        self.assertTrue(integ["healthy"])
        proof = self.call("GET", f"/api/anchor/proof/{deed['hash']}")[1]
        self.assertEqual(proof["root"], self.call("GET", "/api/anchor")[1]["merkle_root"])
        self.assertEqual(self.call("GET", "/api/stats")[1]["healthy"], True)

    def test_lab_over_http(self):
        s, res, _ = self.call("POST", "/api/lab/run")
        self.assertEqual(s, 200); self.assertTrue(all(r["stopped"] for r in res))

    def test_unknown_route_404(self):
        self.assertEqual(self.call("GET", "/api/nothing")[0], 404)

    def test_healthz_and_health_endpoints(self):
        s, b, h = self.call("GET", "/healthz")
        self.assertEqual(s, 200)
        self.assertEqual(b, {"ok": True})
        self.assertIn("application/json", h.get("Content-Type", ""))
        s, b, _ = self.call("GET", "/api/health")
        self.assertEqual((s, b), (200, {"ok": True}))

    def test_get_host_port_defaults_and_fallbacks(self):
        # 1. Missing PORT and HOST -> ('0.0.0.0', 8000)
        with unittest.mock.patch.dict(os.environ, {}, clear=True):
            self.assertEqual(get_host_port(), ("0.0.0.0", 8000))

        # 2. Empty PORT and HOST -> ('0.0.0.0', 8000)
        with unittest.mock.patch.dict(os.environ, {"PORT": "", "HOST": ""}):
            self.assertEqual(get_host_port(), ("0.0.0.0", 8000))

        # 3. Whitespace PORT -> ('0.0.0.0', 8000)
        with unittest.mock.patch.dict(os.environ, {"PORT": "   ", "HOST": ""}):
            self.assertEqual(get_host_port(), ("0.0.0.0", 8000))

        # 4. Valid Render PORT -> ('0.0.0.0', 10000)
        with unittest.mock.patch.dict(os.environ, {"PORT": "10000"}):
            self.assertEqual(get_host_port(), ("0.0.0.0", 10000))

        # 5. Invalid non-integer PORT -> falls back to 8000
        with unittest.mock.patch.dict(os.environ, {"PORT": "invalid_port"}):
            self.assertEqual(get_host_port(), ("0.0.0.0", 8000))

        # 6. Custom HOST -> ('127.0.0.1', 8000)
        with unittest.mock.patch.dict(os.environ, {"HOST": "127.0.0.1", "PORT": ""}):
            self.assertEqual(get_host_port(), ("127.0.0.1", 8000))


if __name__ == "__main__":
    unittest.main()
