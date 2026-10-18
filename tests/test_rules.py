import unittest

from bhumi import rules

NOW = 1_000_000_000
D = 86400


def ctx(**kw):
    plot = dict(owner="A", locked=0, khas=0, acquisition=0, court_case=0)
    plot.update(kw.pop("plot", {}))
    base = dict(plot=plot, seller="A", buyer="B", price=1_000_000, area=1.0, sale_ts=[], median_ppd=None,
                buyer_recent=0, lien=False, survey_mismatch=False, now=NOW)
    base.update(kw)
    return base


def codes(c):
    return {f["code"] for f in rules.evaluate(c)}


class RuleTests(unittest.TestCase):
    def test_clean_sale_has_no_flags(self):
        self.assertEqual(rules.evaluate(ctx()), [])

    def test_missing_plot(self):
        self.assertEqual(codes({"plot": None}), {"NO_PLOT"})

    def test_fake_seller_blocked(self):
        f = rules.evaluate(ctx(seller="X"))
        self.assertTrue(rules.blocked(f)); self.assertEqual(f[0]["code"], "NOT_OWNER")

    def test_locked_blocked(self):
        self.assertIn("LOCKED", codes(ctx(plot={"locked": 1})))

    def test_government_land_blocked(self):
        self.assertIn("GOV_LAND", codes(ctx(plot={"khas": 1})))
        self.assertIn("GOV_LAND", codes(ctx(plot={"acquisition": 1})))

    def test_lien_blocked(self):
        self.assertTrue(rules.blocked(rules.evaluate(ctx(lien=True))))

    def test_court_case_warns_but_allows(self):
        f = rules.evaluate(ctx(plot={"court_case": 1}))
        self.assertFalse(rules.blocked(f)); self.assertEqual(f[0]["code"], "COURT_CASE")

    def test_rapid_transfer_needs_two_recent_sales(self):
        self.assertNotIn("RAPID_TRANSFER", codes(ctx(sale_ts=[NOW - 5 * D])))
        self.assertIn("RAPID_TRANSFER", codes(ctx(sale_ts=[NOW - 5 * D, NOW - 9 * D])))
        self.assertNotIn("RAPID_TRANSFER", codes(ctx(sale_ts=[NOW - 50 * D, NOW - 60 * D])))

    def test_price_anomaly_both_directions(self):
        self.assertIn("PRICE_ANOMALY", codes(ctx(price=100_000, median_ppd=1_000_000)))
        self.assertIn("PRICE_ANOMALY", codes(ctx(price=9_000_000, median_ppd=1_000_000)))
        self.assertNotIn("PRICE_ANOMALY", codes(ctx(price=1_100_000, median_ppd=1_000_000)))
        self.assertNotIn("PRICE_ANOMALY", codes(ctx(price=100_000, median_ppd=None)))

    def test_repeat_buyer_and_self_transfer(self):
        self.assertIn("REPEAT_BUYER", codes(ctx(buyer_recent=2)))
        self.assertIn("SELF_TRANSFER", codes(ctx(buyer="A")))

    def test_risk_score_capped_and_explained(self):
        f = rules.evaluate(ctx(plot={"court_case": 1}, survey_mismatch=True, buyer_recent=3, buyer="A"))
        self.assertEqual(rules.risk_score(f), 100)  # 60+40+20+15 is capped at 100
        self.assertEqual(rules.risk_level(rules.risk_score(f)), "HIGH")
        self.assertTrue(all(x["bn"] and x["en"] for x in f))

    def test_median(self):
        self.assertIsNone(rules.median([1])); self.assertEqual(rules.median([1, 3]), 2); self.assertEqual(rules.median([5, 1, 3]), 3)


if __name__ == "__main__":
    unittest.main()
