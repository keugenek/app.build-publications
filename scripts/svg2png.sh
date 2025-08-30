#!/usr/bin/env bash
set -euo pipefail

# Usage: ./svg2png.sh input.svg output.png [width]
in_svg="$1"
out_png="$2"
width="${3:-1600}"

if [ ! -f "$in_svg" ]; then
  echo "Input SVG not found: $in_svg" >&2
  exit 1
fi

mkdir -p "$(dirname "$out_png")"

try_inkscape() {
  if command -v inkscape >/dev/null 2>&1; then
    inkscape "$in_svg" --export-type=png --export-filename="$out_png" --export-width="$width" --export-background=white --export-background-opacity=1
    return 0
  fi
  return 1
}

try_rsvg() {
  if command -v rsvg-convert >/dev/null 2>&1; then
    rsvg-convert -w "$width" -b white -o "$out_png" "$in_svg"
    return 0
  fi
  return 1
}

try_imagemagick() {
  if command -v magick >/dev/null 2>&1; then
    magick -density 300 "$in_svg" -resize ${width}x -background white -alpha remove -alpha off "$out_png"
    return 0
  fi
  if command -v convert >/dev/null 2>&1; then
    convert -density 300 "$in_svg" -resize ${width}x -background white -alpha remove -alpha off "$out_png"
    return 0
  fi
  return 1
}

try_cairosvg() {
  if command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY'
import sys
try:
  from cairosvg import svg2png
except Exception:
  sys.exit(2)
in_svg = sys.argv[1]
out_png = sys.argv[2]
width = int(sys.argv[3])
svg2png(url=in_svg, write_to=out_png, output_width=width, background_color='white')
PY
    rc=$?
    if [ $rc -eq 0 ]; then return 0; fi
  fi
  return 1
}

if try_inkscape || try_rsvg || try_imagemagick || try_cairosvg; then
  echo "Wrote $out_png"
  exit 0
fi

echo "No SVG->PNG converter available (inkscape/rsvg-convert/ImageMagick/cairosvg missing)." >&2
exit 1


