"""Crypto core of Bhumi Lipi.

Every deed is a *block*. A block's hash commits to all its fields AND to the hash of the
previous block of the same plot, so changing any old record breaks every hash after it.
Each block is signed by the Ed25519 key of the office that registered it.

Merkle roots over all block hashes are the daily "anchor": publish the root publicly and
nobody (not even an insider holding a key) can rewrite history without the roots changing.
"""
import base64
import hashlib
import json
import os

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

GENESIS = "GENESIS"
CANON_FIELDS = ("plot_id", "seq", "kind", "deed_no", "frm", "to", "ts",
                "doc_hash", "price_bdt", "office_id", "prev")


def sha256_hex(data) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def canonical(block: dict) -> bytes:
    """Stable byte form of a block. Same input always gives the same bytes."""
    return json.dumps({k: block[k] for k in CANON_FIELDS},
                      sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def block_hash(block: dict) -> str:
    return hashlib.sha256(canonical(block)).hexdigest()


# ---------------------------------------------------------------- keys
class Keyring:
    """One Ed25519 key per office, derived from a master secret.

    Demo only: in production each office keeps its own key in hardware (HSM / smartcard)
    and only the PUBLIC keys are shared. We derive keys here so the demo is reproducible.
    """

    def __init__(self, master: bytes):
        self.master = master
        self._cache: dict[str, Ed25519PrivateKey] = {}

    def _private(self, office_id: str) -> Ed25519PrivateKey:
        if office_id not in self._cache:
            seed = hashlib.sha256(self.master + b"|" + office_id.encode()).digest()
            self._cache[office_id] = Ed25519PrivateKey.from_private_bytes(seed)
        return self._cache[office_id]

    def public_b64(self, office_id: str) -> str:
        raw = self._private(office_id).public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        return base64.b64encode(raw).decode()

    def sign(self, office_id: str, digest_hex: str) -> str:
        return base64.b64encode(self._private(office_id).sign(bytes.fromhex(digest_hex))).decode()

    def verify(self, office_id: str, digest_hex: str, sig_b64: str) -> bool:
        return verify_signature(self.public_b64(office_id), digest_hex, sig_b64)


def verify_signature(public_b64: str, digest_hex: str, sig_b64: str) -> bool:
    try:
        pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(public_b64))
        pub.verify(base64.b64decode(sig_b64), bytes.fromhex(digest_hex))
        return True
    except Exception:
        return False


def load_master(path: str = "keys/master.key") -> bytes:
    """Order: env BHUMI_MASTER_B64, then key file, else generate a new one."""
    env = os.environ.get("BHUMI_MASTER_B64")
    if env:
        try:
            padded = env + "=" * (-len(env) % 4)
            return base64.b64decode(padded)
        except Exception:
            return env.encode("utf-8")
    if os.path.exists(path):
        return open(path, "rb").read()
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    key = os.urandom(32)
    with open(path, "wb") as f:
        f.write(key)
    return key


# ---------------------------------------------------------------- merkle
def _leaf(h: str) -> bytes:
    return hashlib.sha256(b"\x00" + bytes.fromhex(h)).digest()


def _node(left: bytes, right: bytes) -> bytes:
    return hashlib.sha256(b"\x01" + left + right).digest()


def merkle_root(hashes: list[str]) -> str:
    """Root over block hashes. Leaf and node hashes use different prefixes (0x00 / 0x01)."""
    if not hashes:
        return hashlib.sha256(b"").hexdigest()
    level = [_leaf(h) for h in hashes]
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        level = [_node(level[i], level[i + 1]) for i in range(0, len(level), 2)]
    return level[0].hex()


def merkle_proof(hashes: list[str], index: int) -> list[dict]:
    """Sibling path from leaf to root. side says where the sibling sits: 'L' or 'R'."""
    level = [_leaf(h) for h in hashes]
    proof = []
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        sibling = index ^ 1
        proof.append({"h": level[sibling].hex(), "side": "R" if index % 2 == 0 else "L"})
        level = [_node(level[i], level[i + 1]) for i in range(0, len(level), 2)]
        index //= 2
    return proof


def verify_proof(leaf_hash: str, proof: list[dict], root: str) -> bool:
    cur = _leaf(leaf_hash)
    for step in proof:
        sib = bytes.fromhex(step["h"])
        cur = _node(cur, sib) if step["side"] == "R" else _node(sib, cur)
    return cur.hex() == root
