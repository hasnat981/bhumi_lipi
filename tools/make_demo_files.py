#!/usr/bin/env python3
"""Make two demo deed files for the Verify page (video / live demo):
   demo_files/genuine_deed.txt   -> drop on Verify: GENUINE
   demo_files/tampered_deed.txt  -> same file, one price edited: FORGED
Usage (server must be running):  python tools/make_demo_files.py [http://127.0.0.1:8000]
"""
import json, os, sys, urllib.request

base = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
get = lambda path: urllib.request.urlopen(base + path).read()
plot = json.loads(get("/api/plots/DHK-UTT-0143"))
latest = plot["history"][-1]["hash"]
doc = get(f"/api/deeds/{latest}/document").decode("utf-8")
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "demo_files")
os.makedirs(out, exist_ok=True)
open(os.path.join(out, "genuine_deed.txt"), "w", encoding="utf-8", newline="").write(doc)
open(os.path.join(out, "tampered_deed.txt"), "w", encoding="utf-8", newline="").write(doc.replace("5,000,000", "500,000"))
print("written: demo_files/genuine_deed.txt and demo_files/tampered_deed.txt")
