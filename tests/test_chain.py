import unittest

from bhumi import chain


def make(n=3, ring=None):
    ring = ring or chain.Keyring(b"k" * 32)
    prev, out = chain.GENESIS, []
    for i in range(1, n + 1):
        b = dict(plot_id="DHK-UTT-0001", seq=i, kind="SALE", deed_no=f"D{i}", frm=f"o{i-1}", to=f"o{i}", ts=1000 + i,
                 doc_hash="d" * 64, price_bdt=1, office_id="SR-DHK", prev=prev)
        b["hash"] = chain.block_hash(b)
        b["sig"] = ring.sign("SR-DHK", b["hash"])
        out.append(b)
        prev = b["hash"]
    return ring, out


class ChainTests(unittest.TestCase):
    def test_signature_roundtrip(self):
        ring, blocks = make()
        self.assertTrue(all(ring.verify("SR-DHK", b["hash"], b["sig"]) for b in blocks))

    def test_wrong_office_key_fails(self):
        ring, blocks = make()
        self.assertFalse(ring.verify("SR-CTG", blocks[0]["hash"], blocks[0]["sig"]))

    def test_any_field_change_changes_hash(self):
        _, blocks = make()
        for field, value in (("to", "evil"), ("price_bdt", 2), ("ts", 5), ("doc_hash", "e" * 64), ("kind", "INIT")):
            b = dict(blocks[1]); b[field] = value
            self.assertNotEqual(chain.block_hash(b), blocks[1]["hash"], field)

    def test_merkle_proof_every_leaf(self):
        for n in (1, 2, 3, 5, 8, 13):
            hashes = [chain.sha256_hex(str(i)) for i in range(n)]
            root = chain.merkle_root(hashes)
            for i, h in enumerate(hashes):
                self.assertTrue(chain.verify_proof(h, chain.merkle_proof(hashes, i), root), (n, i))

    def test_merkle_detects_change_and_wrong_leaf(self):
        hashes = [chain.sha256_hex(str(i)) for i in range(6)]
        root = chain.merkle_root(hashes)
        changed = hashes[:]; changed[3] = chain.sha256_hex("x")
        self.assertNotEqual(chain.merkle_root(changed), root)
        self.assertFalse(chain.verify_proof(chain.sha256_hex("nope"), chain.merkle_proof(hashes, 2), root))


if __name__ == "__main__":
    unittest.main()
