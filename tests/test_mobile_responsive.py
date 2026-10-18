"""Mobile Responsive Playwright Verification Suite (Ticket P4).
Tests 360px, 390px, and 412px viewports across all screens:
- No horizontal overflow (scrollWidth <= innerWidth)
- Tap targets >= 44x44px for primary controls & tab items
- Nothing obscured behind the fixed bottom tab bar
"""
import os, sys, unittest
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://127.0.0.1:8000")
VIEWPORTS = [
    {"name": "360px (Small Android)", "width": 360, "height": 640},
    {"name": "390px (iPhone 12/13/14)", "width": 390, "height": 844},
    {"name": "412px (Pixel / Galaxy)", "width": 412, "height": 915},
]

ROUTES = [
    "/",
    "/#/check",
    "/#/check/DHK-UTT-0142",
    "/#/check/DHK-GUL-0309",
    "/#/verify",
    "/#/integrity",
    "/#/about",
    "/#/registrar",
    "/#/mutation",
    "/#/bank",
    "/#/lab",
    "/#/ai",
]


class TestMobileResponsive(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def test_viewports_no_horizontal_overflow(self):
        """Every screen must fit within viewport width with zero horizontal scrollbar."""
        for vp in VIEWPORTS:
            ctx = self.browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            ctx.route("**/fonts.g*apis.com/**", lambda r: r.abort())
            page = ctx.new_page()

            for route in ROUTES:
                with self.subTest(viewport=vp["name"], route=route):
                    page.goto(BASE + route)
                    page.wait_for_timeout(400)

                    # Assert no horizontal overflow
                    metrics = page.evaluate("""() => {
                        const doc = document.documentElement;
                        const body = document.body;
                        const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
                        const clientW = doc.clientWidth;
                        const innerW = window.innerWidth;
                        return { scrollW, clientW, innerW, diff: scrollW - innerW };
                    }""")

                    self.assertLessEqual(
                        metrics["scrollW"],
                        metrics["innerW"] + 1,  # allow 1px subpixel rounding
                        f"Horizontal overflow on {route} at {vp['name']}: scrollWidth={metrics['scrollW']} > innerWidth={metrics['innerW']}"
                    )

            ctx.close()

    def test_mobile_tap_targets(self):
        """Header settings, bottom tab bar items, and primary buttons must be >= 44x44px."""
        ctx = self.browser.new_context(viewport={"width": 360, "height": 640})
        ctx.route("**/fonts.g*apis.com/**", lambda r: r.abort())
        page = ctx.new_page()

        # Check Home
        page.goto(BASE + "/")
        page.wait_for_timeout(400)

        # Tab bar items
        tab_items = page.locator("#tabbar .tab-item").all()
        self.assertGreaterEqual(len(tab_items), 5, "Mobile tab bar should have 5 items")
        for i, item in enumerate(tab_items):
            box = item.bounding_box()
            self.assertIsNotNone(box, f"Tab item {i} must be rendered")
            self.assertGreaterEqual(box["height"], 44, f"Tab item {i} height {box['height']} must be >= 44px")
            self.assertGreaterEqual(box["width"], 44, f"Tab item {i} width {box['width']} must be >= 44px")

        # Header settings toggle button
        settings_btn = page.locator("#settingsbtn")
        self.assertTrue(settings_btn.is_visible(), "Mobile settings button should be visible under 480px")
        sbox = settings_btn.bounding_box()
        self.assertGreaterEqual(sbox["height"], 44, f"Settings button height {sbox['height']} must be >= 44px")
        self.assertGreaterEqual(sbox["width"], 44, f"Settings button width {sbox['width']} must be >= 44px")

        # Floating AI button
        fab = page.locator(".ai-fab-btn")
        self.assertTrue(fab.is_visible(), "Floating AI button should be visible")
        fbox = fab.bounding_box()
        self.assertGreaterEqual(fbox["height"], 50, f"AI FAB height {fbox['height']} should be >= 50px")
        self.assertGreaterEqual(fbox["width"], 50, f"AI FAB width {fbox['width']} should be >= 50px")

        # Verify AI button sits strictly above the 64px tab bar
        tab_box = page.locator("#tabbar").bounding_box()
        self.assertLess(
            fbox["y"] + fbox["height"],
            tab_box["y"],
            f"Floating AI button bottom ({fbox['y'] + fbox['height']}) must be above tab bar top ({tab_box['y']})"
        )

        ctx.close()

    def test_content_not_covered_by_bottom_tabbar(self):
        """When scrolled to bottom, footer and verifier script link must clear the bottom tab bar."""
        for vp in VIEWPORTS:
            ctx = self.browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            ctx.route("**/fonts.g*apis.com/**", lambda r: r.abort())
            page = ctx.new_page()

            page.goto(BASE + "/#/integrity")
            page.wait_for_timeout(400)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(300)

            # Check footer verifier link visibility and clearance
            link = page.locator("a[href='/tools/verify_anchor.py']").first
            self.assertTrue(link.is_visible(), "Independent verifier script link should be in DOM")
            box = link.bounding_box()
            tab_box = page.locator("#tabbar").bounding_box()

            self.assertIsNotNone(box)
            self.assertIsNotNone(tab_box)
            self.assertLess(
                box["y"] + box["height"],
                tab_box["y"] + 1,
                f"Footer link bottom ({box['y'] + box['height']}) was obscured by tab bar top ({tab_box['y']}) at {vp['name']}"
            )

            ctx.close()

    def test_mobile_navigation_sheets(self):
        """Mobile settings menu and More bottom sheet must open and close properly."""
        ctx = self.browser.new_context(viewport={"width": 390, "height": 844})
        ctx.route("**/fonts.g*apis.com/**", lambda r: r.abort())
        page = ctx.new_page()

        page.goto(BASE + "/")
        page.wait_for_timeout(400)

        # 1. Test settings popover
        popover = page.locator("#settings-popover")
        self.assertFalse(popover.is_visible(), "Settings popover should start hidden")
        page.click("#settingsbtn")
        self.assertTrue(popover.is_visible(), "Settings popover should open on click")
        page.click("#settingsbtn")
        page.wait_for_timeout(200)
        self.assertFalse(popover.is_visible(), "Settings popover should close when toggled")

        # 2. Test More sheet
        sheet = page.locator("#tab-more-sheet")
        self.assertFalse(sheet.is_visible(), "More sheet should start closed")
        page.click("#tab-more-btn")
        page.wait_for_timeout(300)
        self.assertTrue(sheet.is_visible(), "More sheet should open on More tab click")

        # Check links in More sheet (Registrar, Mutation, Bank, Lab, AI)
        self.assertTrue(page.locator("#tab-more-sheet a[href='#/registrar']").is_visible())
        self.assertTrue(page.locator("#tab-more-sheet a[href='#/mutation']").is_visible())
        self.assertTrue(page.locator("#tab-more-sheet a[href='#/bank']").is_visible())
        self.assertTrue(page.locator("#tab-more-sheet a[href='#/lab']").is_visible())
        self.assertTrue(page.locator("#tab-more-sheet a[href='#/ai']").is_visible())

        # Click a link inside More sheet -> should navigate and close sheet
        page.click("#tab-more-sheet a[href='#/lab']")
        page.wait_for_timeout(400)
        self.assertIn("#/lab", page.url)

        ctx.close()


if __name__ == "__main__":
    unittest.main()
