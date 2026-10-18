"""e-Mutation workflow (Problem P4).

Today, registration (sub-registry) and mutation (AC Land) are separate paper steps.
Here a registered deed starts its mutation automatically, runs automatic checks, and
an AC Land officer only has to decide. Every step is written to a timeline.

    SUBMITTED -> AUTO_CHECKING -> AUTO_PASSED | FLAGGED -> APPROVED | REJECTED
"""

STATES = ("SUBMITTED", "AUTO_CHECKING", "AUTO_PASSED", "FLAGGED", "APPROVED", "REJECTED")

TRANSITIONS = {
    "SUBMITTED": {"AUTO_CHECKING"},
    "AUTO_CHECKING": {"AUTO_PASSED", "FLAGGED"},
    "AUTO_PASSED": {"APPROVED", "REJECTED"},
    "FLAGGED": {"APPROVED", "REJECTED"},
    "APPROVED": set(),
    "REJECTED": set(),
}

LABELS = {
    "SUBMITTED": ("আবেদন জমা হয়েছে", "Application submitted"),
    "AUTO_CHECKING": ("স্বয়ংক্রিয় যাচাই চলছে", "Automatic checks running"),
    "AUTO_PASSED": ("স্বয়ংক্রিয় যাচাই সফল", "Automatic checks passed"),
    "FLAGGED": ("কর্মকর্তার নজর প্রয়োজন", "Needs officer review"),
    "APPROVED": ("নামজারি অনুমোদিত", "Mutation approved"),
    "REJECTED": ("নামজারি বাতিল", "Mutation rejected"),
}

# (check id, flag code that fails it, Bangla, English)
CHECKS = [
    ("SIGNATURE", None, "দলিলের ডিজিটাল সিল ঠিক আছে", "Digital seal of the deed is valid"),
    ("OWNER", "NOT_OWNER", "বিক্রেতা রেকর্ডের মালিক ছিলেন", "Seller was the registered owner"),
    ("GOV_LAND", "GOV_LAND", "সরকারি (খাস/অধিগ্রহণ) জমি নয়", "Not government (khas / acquired) land"),
    ("LIEN", "LIEN", "ব্যাংকে বন্ধক নেই", "No bank lien"),
    ("COURT", "COURT_CASE", "চলমান মামলা নেই", "No pending court case"),
    ("SURVEY", "SURVEY_MISMATCH", "CS/SA/RS/BS জরিপের পরিমাণ মিলেছে", "Area matches CS/SA/RS/BS surveys"),
    ("PRICE", "PRICE_ANOMALY", "দাম এলাকার স্বাভাবিক সীমার মধ্যে", "Price is in the normal range"),
    ("RAPID", "RAPID_TRANSFER", "দ্রুত হাত বদলের লক্ষণ নেই", "No sign of rapid resale"),
]


def can_move(src: str, dst: str) -> bool:
    return dst in TRANSITIONS.get(src, set())


def run_checks(flags: list[dict], signature_ok: bool) -> list[dict]:
    """Turn rule flags into a pass/fail checklist the officer can read in one glance."""
    codes = {f["code"] for f in flags}
    out = []
    for cid, code, bn, en in CHECKS:
        ok = signature_ok if code is None else code not in codes
        out.append({"id": cid, "ok": ok, "bn": bn, "en": en})
    return out


def all_passed(checks: list[dict]) -> bool:
    return all(c["ok"] for c in checks)


# How long an application may wait before the officer queue shows a warning (days).
AGING_AMBER_DAYS = 14
AGING_RED_DAYS = 30


def aging(state: str, waiting_days: int):
    """None for decided applications; 'green', 'amber' or 'red' for pending ones."""
    if state not in ("AUTO_PASSED", "FLAGGED", "AUTO_CHECKING", "SUBMITTED"):
        return None
    return "red" if waiting_days >= AGING_RED_DAYS else "amber" if waiting_days >= AGING_AMBER_DAYS else "green"
