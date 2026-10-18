"""Browser end-to-end test (optional, needs: pip install playwright && playwright install chromium).
Start the app first:  python server.py   then:  BASE=http://127.0.0.1:8000 python tests/e2e_playwright.py
Walks the whole demo story like a judge would and fails loudly if anything breaks."""
import os, sys
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("BASE", "http://127.0.0.1:8000")
SHOTS = os.environ.get("SHOTS")  # directory for screenshots (optional)
errors = []


def shot(page, name):
    if SHOTS:
        page.wait_for_timeout(1300)  # let entrance animations finish
        page.screenshot(path=f"{SHOTS}/{name}.png", full_page=True)


def role(page, r):
    page.select_option("#role", r)
    page.wait_for_timeout(1200)  # the page re-renders for the new role


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1280, "height": 900}, ignore_https_errors=True)
    ctx.route("**/fonts.g*apis.com/**", lambda r: r.abort())
    ctx.add_init_script("localStorage.setItem('bl.lang','en')")
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" and "fonts" not in m.text and "ERR_FAILED" not in m.text and "409" not in m.text else None)  # 409 = a fraud attempt we meant to block

    # 1 home + citizen check
    page.goto(BASE); expect(page.locator("h1")).to_contain_text("Land papers"); shot(page, "01-home")
    page.click("text=Clean plot"); expect(page.locator(".verdict")).to_contain_text("genuine"); shot(page, "02-check-green")
    # Simple mode: default for citizens, three words + shapes, big buttons, no timeline until asked
    expect(page.locator(".threeword")).to_contain_text("Go ahead"); expect(page.locator(".timeline")).to_be_hidden()
    page.click("#viewtoggle"); expect(page.locator(".timeline")).to_be_visible(); page.click("#viewtoggle"); expect(page.locator(".timeline")).to_be_hidden()
    page.goto(BASE + "/#/check/DHK-GUL-0309"); expect(page.locator(".verdict.amber")).to_be_visible(); expect(page.locator(".threeword")).to_contain_text("Careful"); shot(page, "03-check-amber")
    # Ana-Gonda helper: 8 ana is half of the 6 decimal plot; more than 16 ana is refused politely
    page.click("summary"); expect(page.locator("#ag-ana")).to_have_value("8"); expect(page.locator(".agcalc .owner")).to_contain_text("3 decimal"); shot(page, "03b-anagonda")
    page.fill("#ag-ana", "17"); expect(page.locator(".agcalc .owner")).to_contain_text("cannot be more")
    page.fill("#ag-ana", "1"); page.fill("#ag-gonda", "10"); expect(page.locator(".agcalc .owner")).to_contain_text("%")
    expect(page.locator(".listen")).to_be_hidden()  # no Bangla voice in this browser: the button must not show
    vp = ctx.new_page()  # a device that HAS a Bangla voice: the Listen button appears
    vp.add_init_script("Object.defineProperty(window.speechSynthesis,'getVoices',{value:()=>[{lang:'bn-BD',name:'Test Bangla'}]})")
    vp.goto(BASE + "/#/check/DHK-UTT-0142"); expect(vp.locator(".listen")).to_be_visible(); vp.close()
    # Text size and high contrast controls (saved for the next pages)
    page.click("#sizebtn"); expect(page.locator("#sizebtn")).to_have_attribute("data-size", "125"); expect(page.locator("body")).to_have_css("font-size", "20px")
    page.click("#contrastbtn"); expect(page.locator("html")).to_have_attribute("data-contrast", "high"); shot(page, "03c-big-text-contrast")
    page.click("#contrastbtn"); expect(page.locator("html")).not_to_have_attribute("data-contrast", "high")
    page.click("#sizebtn"); page.click("#sizebtn"); expect(page.locator("#sizebtn")).to_have_attribute("data-size", "100")
    page.goto(BASE + "/#/check/KHL-DUM-0033"); expect(page.locator(".verdict.red")).to_be_visible(); shot(page, "04-check-red")
    page.goto(BASE + "/#/check"); expect(page.locator("a.card").first).to_be_visible(); shot(page, "05-picker")

    # 2 verify: real text is genuine, one changed character is forged
    page.goto(BASE + "/#/verify"); page.click("role=tab[name=/cheat/i]"); page.click("text=Load sample deed")
    expect(page.locator("textarea")).not_to_be_empty()
    page.click("text=Verify this text"); expect(page.locator(".verdict.green")).to_contain_text("Genuine"); shot(page, "06-verify-genuine")
    ta = page.locator("textarea"); ta.fill(ta.input_value().replace("BDT", "BDT 9"))
    page.click("text=Verify this text"); expect(page.locator(".verdict.forged")).to_contain_text("Forged"); shot(page, "07-verify-forged")

    # 3 registrar: fake seller blocked, normal sale sealed with a QR that decodes to the seal link
    page.goto(BASE + "/#/registrar"); role(page, "registrar")
    expect(page.locator("#plot")).to_be_visible(); page.get_by_role("button", name="Fake seller").click(); page.wait_for_timeout(700); page.get_by_role("button", name="Register and seal").click()
    expect(page.locator(".verdict.red")).to_contain_text("blocked"); shot(page, "08-registrar-blocked")
    page.get_by_role("button", name="Normal sale").click(); page.wait_for_timeout(700); page.get_by_role("button", name="Register and seal").click()
    expect(page.locator(".qrbox svg")).to_be_visible(); shot(page, "09-registrar-sealed")
    page.locator(".qrbox").screenshot(path="/tmp/qr_e2e.png")
    import cv2
    decoded, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.copyMakeBorder(cv2.imread("/tmp/qr_e2e.png"), 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=(255, 255, 255)))
    assert "/#/v/" in decoded, f"QR did not decode: {decoded!r}"
    tracking = page.locator("a[href^='#/mutation/MUT-']").first.inner_text()
    seal_url = decoded

    # 4 the QR link verifies as genuine; plot is now locked (amber); second sale blocked
    page.goto(seal_url.replace("http://127.0.0.1:8765", BASE)); expect(page.locator(".verdict.green")).to_contain_text("Genuine")
    page.goto(BASE + "/#/check/DHK-UTT-0142"); expect(page.locator(".verdict.amber")).to_be_visible()

    # 5 AC Land approves, plot unlocks
    page.goto(BASE + "/#/mutation/" + tracking); role(page, "ac_land"); shot(page, "10-mutation-officer")
    expect(page.locator("[data-aging]")).to_contain_text("Waiting")  # aging chip while pending
    page.click("text=Approve (unlock land)"); expect(page.locator(".verdict")).to_contain_text("approved"); expect(page.get_by_text("Took 0 days")).to_be_visible(); shot(page, "11-mutation-approved")
    page.goto(BASE + "/#/check/DHK-UTT-0142"); expect(page.locator(".verdict.green")).to_be_visible()

    # 6 bank: second mortgage blocked
    page.goto(BASE + "/#/bank"); role(page, "bank"); page.select_option("#bp", "SYL-ZKJ-0210"); page.click("text=Register lien")
    expect(page.locator(".verdict.red")).to_contain_text("already mortgaged"); shot(page, "12-bank")

    # 7 integrity + inclusion proof verified in the browser
    page.goto(BASE + "/#/integrity"); expect(page.locator(".verdict.green").first).to_contain_text("intact")
    page.click("text=Verify proof"); expect(page.locator(".verdict.green").last).to_contain_text("valid"); shot(page, "13-integrity")

    # 8 attack lab
    page.goto(BASE + "/#/lab"); page.click("text=Run all attacks")
    expect(page.locator(".chip.green")).to_have_count(5, timeout=15000); expect(page.locator(".verdict.green")).to_contain_text("All 5"); shot(page, "14-lab")

    # 9 about, bangla, mobile, dark
    page.goto(BASE + "/#/about"); shot(page, "15-about")
    page.click("button[aria-label='Switch language']"); page.wait_for_timeout(300); shot(page, "16-about-bn")
    page.goto(BASE + "/#/"); shot(page, "17-home-bn")
    m = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, color_scheme="dark", bypass_csp=True)  # bypass only so the test can call evaluate()
    m.route("**/fonts.g*apis.com/**", lambda r: r.abort()); m.add_init_script("localStorage.setItem('bl.lang','en')")
    mp = m.new_page(); mp.on("pageerror", lambda e: errors.append(f"mobile pageerror: {e}"))
    mp.goto(BASE); shot(mp, "18-mobile-home-dark"); mp.goto(BASE + "/#/check/CTG-PAT-0120"); shot(mp, "19-mobile-check-dark")
    mp.goto(BASE + "/#/verify"); shot(mp, "20-mobile-verify-dark")
    overflow = mp.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    assert not overflow, "mobile page scrolls sideways"
    b.close()

if errors:
    print("BROWSER ERRORS:\n" + "\n".join(errors)); sys.exit(1)
print("E2E OK: full demo story passed in a real browser")
