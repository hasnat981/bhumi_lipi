"""Checks the Ana/Gonda/Kora/Kranti calculator maths in web/js/a11y.js with Node (skipped if Node is missing)."""
import json, os, shutil, subprocess, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

JS = """
import { shareFraction, shareToDecimal, KRANTI_IN_WHOLE } from %s;
const out = {
  whole: shareFraction({ ana: 16 }),
  half: shareFraction({ ana: 8 }),
  oneAnaInGonda: shareFraction({ gonda: 20 }) === shareFraction({ ana: 1 }),
  oneGondaInKora: shareFraction({ kora: 4 }) === shareFraction({ gonda: 1 }),
  oneKoraInKranti: shareFraction({ kranti: 3 }) === shareFraction({ kora: 1 }),
  wholeInGonda: shareFraction({ gonda: 320 }),
  mixed: shareFraction({ ana: 4, gonda: 10 }),
  decimal: shareToDecimal({ ana: 8 }, 6),
  junk: shareFraction({ ana: -3, gonda: 'abc' }),
  total: KRANTI_IN_WHOLE,
};
console.log(JSON.stringify(out));
"""


@unittest.skipUnless(shutil.which("node"), "node is not installed")
class AnaGondaMath(unittest.TestCase):
    def test_units(self):
        path = json.dumps("file://" + os.path.join(ROOT, "web", "js", "a11y.js"))
        r = subprocess.run(["node", "--input-type=module", "-e", JS % path], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        o = json.loads(r.stdout)
        self.assertEqual(o["whole"], 1)
        self.assertEqual(o["half"], 0.5)
        self.assertTrue(o["oneAnaInGonda"] and o["oneGondaInKora"] and o["oneKoraInKranti"])
        self.assertEqual(o["wholeInGonda"], 1)          # 16 ana = 320 gonda = the whole
        self.assertAlmostEqual(o["mixed"], (4 + 10 / 20) / 16)
        self.assertEqual(o["decimal"], 3)               # half of a 6 decimal plot
        self.assertEqual(o["junk"], 0)                  # negative or non-numeric input counts as 0
        self.assertEqual(o["total"], 3840)


if __name__ == "__main__":
    unittest.main()
