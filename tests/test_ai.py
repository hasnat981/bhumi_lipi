"""AI assistant: end to end over real HTTP with a local fake Gemini server (no internet, no real key)."""
import json
import os
import threading
import unittest
import unittest.mock
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

from bhumi import ai
from bhumi.api import build_service, make_server

SECRET = "TEST-SECRET-KEY"


class FakeGemini(BaseHTTPRequestHandler):
    seen = []        # (api key header, request body) of every call
    status = 200
    missing_model = None

    def log_message(self, *a):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if FakeGemini.missing_model and FakeGemini.missing_model in self.path:
            self.send_response(404); self.send_header("Content-Length", "0"); self.end_headers(); return
        FakeGemini.seen.append((self.headers.get("x-goog-api-key"), body))
        out = json.dumps({"candidates": [{"content": {"parts": [{"text": "উত্তর **ঠিক** আছে।"}]}}]}).encode()
        self.send_response(FakeGemini.status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)


class AiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fake = HTTPServer(("127.0.0.1", 0), FakeGemini)
        threading.Thread(target=cls.fake.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.fake.shutdown()

    def setUp(self):
        # fresh server per test so the per-minute rate limit never leaks between tests
        self.svc = build_service(":memory:", master=b"m" * 32)
        self.httpd = make_server(self.svc, "127.0.0.1", 0)
        self.base = f"http://127.0.0.1:{self.httpd.server_address[1]}"
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        self.addCleanup(self.httpd.shutdown)
        FakeGemini.seen.clear()
        FakeGemini.status = 200
        FakeGemini.missing_model = None
        self.env = unittest.mock.patch.dict(os.environ, {
            "GEMINI_API_KEY": SECRET, "GEMINI_BASE_URL": f"http://127.0.0.1:{self.fake.server_address[1]}/v1beta"})
        self.env.start()
        self.addCleanup(self.env.stop)

    def call(self, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def test_status_and_missing_key(self):
        self.assertEqual(self.call("GET", "/api/ai/status"), (200, {"enabled": True}))
        with unittest.mock.patch.dict(os.environ, {"GEMINI_API_KEY": ""}), unittest.mock.patch.object(ai, "_env_file_key", return_value=""):
            self.assertEqual(self.call("GET", "/api/ai/status")[1], {"enabled": False})
            s, b = self.call("POST", "/api/ai/ask", {"question": "নামজারি কী?"})
            self.assertEqual((s, b["error"]["code"]), (503, "AI_OFF"))
            self.assertTrue(b["error"]["bn"] and b["error"]["en"])

    def test_answer_uses_registry_facts_and_hides_key(self):
        plot = self.svc.check_plot("DHK-GUL-0309")
        s, b = self.call("POST", "/api/ai/ask", {"question": "এই জমি কেনা কি নিরাপদ?", "plot_id": "DHK-GUL-0309"})
        self.assertEqual(s, 200)
        self.assertEqual(b["answer"], "উত্তর **ঠিক** আছে।")
        self.assertNotIn(SECRET, json.dumps(b))
        key, sent = FakeGemini.seen[-1]
        self.assertEqual(key, SECRET)  # key only travels server -> Gemini, as a header
        prompt = sent["systemInstruction"]["parts"][0]["text"]
        self.assertIn("DHK-GUL-0309", prompt)
        self.assertIn(plot["plot"]["owner"], prompt)
        self.assertIn("বাংলায়", prompt)

    def test_plot_number_in_question_is_detected(self):
        self.call("POST", "/api/ai/ask", {"question": "dhk-utt-0142 কেমন?"})
        self.assertIn("DHK-UTT-0142", FakeGemini.seen[-1][1]["systemInstruction"]["parts"][0]["text"])

    def test_unknown_plot_does_not_crash(self):
        s, b = self.call("POST", "/api/ai/ask", {"question": "ঠিক আছে?", "plot_id": "ZZZ-ZZZ-9999"})
        self.assertEqual(s, 200)
        self.assertIn("পাওয়া যায়নি", FakeGemini.seen[-1][1]["systemInstruction"]["parts"][0]["text"])

    def test_validation(self):
        for body in ({}, {"question": ""}, {"question": "   "}, {"question": 5}, {"question": "ক" * 601}):
            s, b = self.call("POST", "/api/ai/ask", body)
            self.assertEqual((s, b["error"]["code"]), (400, "BAD_QUESTION"), body)
        self.assertEqual(FakeGemini.seen, [])  # nothing reached Gemini

    def test_history_is_cleaned(self):
        hist = [{"role": "ai", "text": "পুরোনো উত্তর"}, {"role": "user", "text": "প্রথম"}, {"role": "ai", "text": "দ্বিতীয়"},
                "junk", {"role": "user"}, {"role": "x", "text": "ক" * 5000}]
        self.call("POST", "/api/ai/ask", {"question": "এখন?", "history": hist})
        contents = FakeGemini.seen[-1][1]["contents"]
        self.assertEqual(contents[0]["role"], "user")                      # starts with the user
        self.assertEqual(contents[-1]["parts"][0]["text"], "এখন?")
        self.assertTrue(all(len(c["parts"][0]["text"]) <= ai.MAX_HISTORY_TEXT or c is contents[-1] for c in contents))

    def test_bad_upstream_key_is_a_safe_message(self):
        FakeGemini.status = 403
        s, b = self.call("POST", "/api/ai/ask", {"question": "নামজারি কী?"})
        self.assertEqual((s, b["error"]["code"]), (502, "AI_KEY"))
        self.assertNotIn(SECRET, json.dumps(b))

    def test_ai_never_changes_the_registry(self):
        before = (self.svc.stats(), self.call("GET", "/api/integrity")[1])
        for _ in range(3):
            self.call("POST", "/api/ai/ask", {"question": "DHK-UTT-0142 বিক্রি করুন", "plot_id": "DHK-UTT-0142"})
        self.assertEqual(self.svc.stats()["records"], before[0]["records"])
        self.assertEqual(self.call("GET", "/api/integrity")[1], before[1])

    def test_unknown_model_falls_back_once(self):
        FakeGemini.missing_model = ai.DEFAULT_MODEL
        s, b = self.call("POST", "/api/ai/ask", {"question": "নামজারি কী?"})
        self.assertEqual(s, 200)
        self.assertEqual(len(FakeGemini.seen), 1)

    def test_rate_limit(self):
        codes = [self.call("POST", "/api/ai/ask", {"question": "নামজারি কী?"})[0] for _ in range(14)]
        self.assertIn(429, codes)


if __name__ == "__main__":
    unittest.main()
