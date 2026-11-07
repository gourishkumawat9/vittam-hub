"""Build the self-hosted woff2 files in src/fonts (see README.md there): each family's variable font limited to the weights the site uses and subset to Google's "latin" range plus the rupee sign and arrows.

Usage: make_fonts.py <dir with the google/fonts TTFs> <output dir>
"""
import io
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

src_dir, out_dir = sys.argv[1], sys.argv[2]
LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
EXTRA = "U+20B9,U+2190-2199"  # ₹ and arrows used in UI copy

JOBS = [
    ("manrope__Manrope[wght].ttf", {"wght": (500, 700)}, "Manrope-latin.woff2"),
    ("inter__Inter[opsz,wght].ttf", {"opsz": 14, "wght": (400, 600)}, "Inter-latin.woff2"),
    ("ibmplexsans__IBMPlexSans[wdth,wght].ttf", {"wdth": 100, "wght": (500, 700)}, "IBMPlexSans-latin.woff2"),
    ("jetbrainsmono__JetBrainsMono[wght].ttf", {"wght": (400, 500)}, "JetBrainsMono-latin.woff2"),
]

def parse(ranges):
    out = []
    for part in ranges.split(","):
        part = part.strip().replace("U+", "")
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a, 16), int(b, 16) + 1))
        else:
            out.append(int(part, 16))
    return out

unicodes = parse(LATIN + "," + EXTRA)
for src, axes, out in JOBS:
    font = TTFont(f"{src_dir}/{src}")
    font = instancer.instantiateVariableFont(font, axes)
    # Round-trip so every table is fully decompiled before subsetting.
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    font = TTFont(buf)
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    opts.hinting = False
    opts.flavor = "woff2"
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    font.flavor = "woff2"
    font.save(f"{out_dir}/{out}")
    axes_left = [(a.axisTag, a.minValue, a.maxValue) for a in font["fvar"].axes] if "fvar" in font else "static"
    print(out, axes_left)
