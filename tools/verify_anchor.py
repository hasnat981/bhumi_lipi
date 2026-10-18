#!/usr/bin/env python3
"""Independent verifier for Bhumi Lipi. Does NOT import the app and does NOT trust our server.

    python verify_anchor.py bhumi-lipi-export.json
    python verify_anchor.py https://your-site.example/api/export

It re-checks, from the raw export only:
  1. every block hash (SHA-256 of the canonical fields)
  2. every Ed25519 signature, with the office public key from the export
  3. every deed document against its doc_hash
  4. every plot chain (sequence, prev links, ownership replay)
  5. every published Merkle anchor (root over the first N block hashes)
Exit code 0 = all good, 1 = something does not match. Needs: pip install cryptography
"""
import base64
import hashlib
import json
import sys
import urllib.request

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

FIELDS = ("plot_id", "seq", "kind", "deed_no", "frm", "to", "ts", "doc_hash", "price_bdt", "office_id", "prev")


def block_hash(b):
    canon = json.dumps({k: b[k] for k in FIELDS}, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()


def sig_ok(pub_b64, digest_hex, sig_b64):
    try:
        Ed25519PublicKey.from_public_bytes(base64.b64decode(pub_b64)).verify(base64.b64decode(sig_b64), bytes.fromhex(digest_hex))
        return True
    except Exception:
        return False


def merkle_root(hashes):
    if not hashes:
        return hashlib.sha256(b"").hexdigest()
    level = [hashlib.sha256(b"\x00" + bytes.fromhex(h)).digest() for h in hashes]
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        level = [hashlib.sha256(b"\x01" + level[i] + level[i + 1]).digest() for i in range(0, len(level), 2)]
    return level[0].hex()


def load(src):
    if src.startswith("http"):
        with urllib.request.urlopen(src, timeout=30) as r:
            return json.load(r)
    with open(src, encoding="utf-8") as f:
        return json.load(f)


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    data = load(sys.argv[1])
    blocks, anchors, keys = data["blocks"], data["anchors"], data["keys"]
    problems = []
    plots = {}
    for b in blocks:
        plots.setdefault(b["plot_id"], []).append(b)
        if block_hash(b) != b["hash"]:
            problems.append(f"{b['plot_id']} #{b['seq']}: hash does not match its fields")
        if not sig_ok(keys.get(b["office_id"], ""), b["hash"], b["sig"]):
            problems.append(f"{b['plot_id']} #{b['seq']}: bad signature for {b['office_id']}")
        if hashlib.sha256(b["doc"].encode("utf-8")).hexdigest() != b["doc_hash"]:
            problems.append(f"{b['plot_id']} #{b['seq']}: deed document does not match doc_hash")
    for pid, chain in plots.items():
        prev, owner = "GENESIS", None
        for i, b in enumerate(chain, 1):
            if b["seq"] != i:
                problems.append(f"{pid}: sequence gap at #{b['seq']}")
            if b["prev"] != prev:
                problems.append(f"{pid} #{b['seq']}: broken link to previous block")
            if b["kind"] != "INIT" and b["frm"] != owner:
                problems.append(f"{pid} #{b['seq']}: seller is not the previous owner")
            prev, owner = b["hash"], b["to"]
    hashes = [b["hash"] for b in blocks]
    for a in anchors:
        if merkle_root(hashes[: a["block_count"]]) != a["merkle_root"]:
            problems.append(f"anchor #{a['id']}: published Merkle root does NOT match the first {a['block_count']} records")
    print(f"blocks: {len(blocks)}   plots: {len(plots)}   anchors: {len(anchors)}   offices: {len(keys)}")
    if problems:
        print("\nPROBLEMS FOUND:")
        for p in problems:
            print("  -", p)
        return 1
    print("OK: every hash, signature, document, chain and published anchor checks out.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
