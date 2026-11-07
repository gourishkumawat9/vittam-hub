# Self-hosted fonts

The site's four typefaces, served from this folder through `next/font/local`
(see `src/lib/fonts.ts`) so builds never depend on downloading from Google
Fonts.

| File | Family | Weights | Used for |
|---|---|---|---|
| `Manrope-latin.woff2` | Manrope | 500–700 | Headings |
| `Inter-latin.woff2` | Inter (opsz 14) | 400–600 | Body text |
| `IBMPlexSans-latin.woff2` | IBM Plex Sans (wdth 100) | 500–700 | Numbers |
| `JetBrainsMono-latin.woff2` | JetBrains Mono | 400–500 | Code / IDs |

Each is the family's official variable font from
[google/fonts](https://github.com/google/fonts), limited to those weights and
subset to Google's "latin" range plus ₹ (U+20B9) and arrows (U+2190–2199).
All four are under the SIL Open Font License 1.1; the licences are in
`licenses/` and must stay with the files.

## Rebuilding

To change weights or characters, edit `tools/make_fonts.py`, then run this
from `apps/web/src/fonts`:

```sh
python3 -m venv /tmp/ftenv && /tmp/ftenv/bin/pip install fonttools brotli
mkdir -p /tmp/fonts-src
for p in "manrope/Manrope%5Bwght%5D.ttf" "inter/Inter%5Bopsz,wght%5D.ttf" \
         "ibmplexsans/IBMPlexSans%5Bwdth,wght%5D.ttf" "jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf"; do
  name="$(dirname "$p")__$(basename "$p" | sed 's/%5B/[/; s/%5D/]/')"
  curl -sSL -o "/tmp/fonts-src/$name" "https://raw.githubusercontent.com/google/fonts/main/ofl/$p"
done
/tmp/ftenv/bin/python tools/make_fonts.py /tmp/fonts-src .
```

Then update the `weight` ranges in `src/lib/fonts.ts` if they changed.
