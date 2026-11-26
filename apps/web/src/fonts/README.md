# Self-hosted fonts

The site's one typeface, served from this folder through `next/font/local`
(see `src/lib/fonts.ts`) so builds never depend on downloading from Google
Fonts.

| File | Family | Weights | Used for |
|---|---|---|---|
| `Manrope-latin.woff2` | Manrope | 400–700 | Everything: headings, body text and numbers (with tabular figures) |

One typeface keeps the interface calm and matches the design rules in
`docs/02-design-system.md`. Inter, IBM Plex Sans and JetBrains Mono were
dropped in November 2026; numbers use Manrope with `tabular-nums` instead.

It is the family's official variable font from
[google/fonts](https://github.com/google/fonts), limited to those weights and
subset to Google's "latin" range plus ₹ (U+20B9) and arrows (U+2190–2199).
It is under the SIL Open Font License 1.1; the licence is in `licenses/` and
must stay with the file.

## Rebuilding

To change weights or characters, edit `tools/make_fonts.py`, then run this
from `apps/web/src/fonts`:

```sh
python3 -m venv /tmp/ftenv && /tmp/ftenv/bin/pip install fonttools brotli
mkdir -p /tmp/fonts-src
for p in "manrope/Manrope%5Bwght%5D.ttf"; do
  name="$(dirname "$p")__$(basename "$p" | sed 's/%5B/[/; s/%5D/]/')"
  curl -sSL -o "/tmp/fonts-src/$name" "https://raw.githubusercontent.com/google/fonts/main/ofl/$p"
done
/tmp/ftenv/bin/python tools/make_fonts.py /tmp/fonts-src .
```

Then update the `weight` ranges in `src/lib/fonts.ts` if they changed.
