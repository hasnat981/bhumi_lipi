"""Fraud rules (Problem P3). Pure functions: no database, easy to test and to explain.

A rule returns a *flag*: code, level ('block' stops the sale, 'warn' lets it through but
sends it to an officer), weight (adds to the 0-100 risk score) and a message in Bangla
and English. We never show a bare number: the reasons are always listed.
"""

RAPID_WINDOW = 30 * 24 * 3600  # 30 days in seconds

# code: (level, weight, bangla, english)
RULES = {
    "NO_PLOT": ("block", 100, "এই প্লট রেজিস্ট্রিতে নেই।", "Plot not found in the registry."),
    "GOV_LAND": ("block", 100, "এটি সরকারি (খাস বা অধিগ্রহণ) জমি। বিক্রি করা যাবে না।",
                 "This is government (khas or acquired) land. It cannot be sold."),
    "LOCKED": ("block", 100, "আগের বিক্রির নামজারি এখনও শেষ হয়নি। দ্বিতীয় বিক্রি আটকানো হয়েছে।",
               "The earlier sale is still waiting for mutation. A second sale is blocked."),
    "NOT_OWNER": ("block", 100, "বিক্রেতা রেকর্ডে থাকা মালিক নন।",
                  "The seller is not the registered owner."),
    "LIEN": ("block", 100, "জমিটি ব্যাংকে বন্ধক আছে। ঋণ শোধ ছাড়া বিক্রি করা যাবে না।",
             "This land is mortgaged to a bank. It cannot be sold until the lien is released."),
    "COURT_CASE": ("warn", 60, "এই জমি নিয়ে মামলা চলছে।", "A court case is pending on this land."),
    "SURVEY_MISMATCH": ("warn", 40, "পুরোনো জরিপে (CS/SA/RS/BS) জমির পরিমাণ মিলছে না।",
                        "Land area does not match across old surveys (CS/SA/RS/BS)."),
    "RAPID_TRANSFER": ("warn", 30, "৩০ দিনে ২ বা তার বেশিবার হাত বদল হয়েছে।",
                       "This plot changed hands 2 or more times in 30 days."),
    "PRICE_ANOMALY": ("warn", 25, "দাম এই এলাকার স্বাভাবিক দামের চেয়ে অনেক আলাদা।",
                      "The price is far from the normal price in this area."),
    "REPEAT_BUYER": ("warn", 20, "এই ক্রেতা ৩০ দিনে একাধিক জমি কিনেছেন।",
                     "This buyer bought several plots in 30 days."),
    "SELF_TRANSFER": ("warn", 15, "বিক্রেতা ও ক্রেতা একই ব্যক্তি।", "Seller and buyer are the same person."),
}


def flag(code: str, **extra) -> dict:
    level, weight, bn, en = RULES[code]
    return {"code": code, "level": level, "weight": weight, "bn": bn, "en": en, **extra}


def evaluate(ctx: dict) -> list[dict]:
    """ctx keys: plot (dict|None), seller, buyer, price, area, sale_ts (list of earlier sale
    timestamps for this plot), median_ppd (price per decimal in the mouza, or None),
    buyer_recent (plots this buyer bought in 30 days), lien (bool), survey_mismatch (bool), now."""
    plot = ctx["plot"]
    if plot is None:
        return [flag("NO_PLOT")]
    out = []
    if plot["khas"] or plot["acquisition"]:
        out.append(flag("GOV_LAND"))
    if plot["locked"]:
        out.append(flag("LOCKED"))
    if ctx["seller"] != plot["owner"]:
        out.append(flag("NOT_OWNER", registered_owner=plot["owner"]))
    if ctx["lien"]:
        out.append(flag("LIEN"))
    if plot["court_case"]:
        out.append(flag("COURT_CASE"))
    if ctx["survey_mismatch"]:
        out.append(flag("SURVEY_MISMATCH"))
    if sum(1 for t in ctx["sale_ts"] if ctx["now"] - t < RAPID_WINDOW) >= 2:
        out.append(flag("RAPID_TRANSFER"))
    ppd, median = None, ctx["median_ppd"]
    if ctx["price"] > 0 and ctx["area"] > 0:
        ppd = ctx["price"] / ctx["area"]
    if ppd and median and (ppd < 0.4 * median or ppd > 2.5 * median):
        out.append(flag("PRICE_ANOMALY", price_per_decimal=round(ppd), area_median=round(median)))
    if ctx["buyer_recent"] >= 2:
        out.append(flag("REPEAT_BUYER"))
    if ctx["seller"] == ctx["buyer"]:
        out.append(flag("SELF_TRANSFER"))
    return out


def blocked(flags: list[dict]) -> bool:
    return any(f["level"] == "block" for f in flags)


def risk_score(flags: list[dict]) -> int:
    return min(100, sum(f["weight"] for f in flags))


def risk_level(score: int) -> str:
    return "LOW" if score < 30 else "MEDIUM" if score < 70 else "HIGH"


def median(values: list[float]):
    if len(values) < 2:
        return None
    s = sorted(values)
    mid = len(s) // 2
    return s[mid] if len(s) % 2 else (s[mid - 1] + s[mid]) / 2
