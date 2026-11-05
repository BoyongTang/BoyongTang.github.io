"""Make the web copies of Webb's Pillars of Creation in public/sky/ (the tilted, original-colour version).

  python3 scripts/make-pillars-webb.py [assets-src/pillars-webb.jpg]

Source: weic2216b, the "publication" JPEG (2309 x 4000), esawebb.org/images/weic2216b/.
Credit: NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI). CC BY 4.0.
It is sharp enough as it is, so there is no upscale.

Writes
  pillars-max.webp   2309 px wide (full size): loaded when the visitor zooms in
  pillars-wide.webp  1800 px wide: the texture on computers
  pillars-tall.webp  1300 px wide: the texture on phones, and the still image where there is no WebGL
  pillars-maps.png   320 px wide, masks the living sky reads (src/scripts/pillars-gl.ts):
                     R  depth: 1 at the warm, dense pillars, low in the blue haze
                     G  glow: the red star-forming knots at the pillar tips (they pulse)
Needs numpy and Pillow.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
root = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'assets-src' / 'pillars-webb.jpg'
out = root / 'public' / 'sky'
out.mkdir(parents=True, exist_ok=True)

im = Image.open(src).convert('RGB')
assert im.size == (2309, 4000), f'expected the 2309 x 4000 image, got {im.size}'


def copy(name, width, quality):
    im.resize((width, round(width * im.height / im.width)), Image.LANCZOS).save(out / name, quality=quality, method=6)


copy('pillars-max.webp', 2309, 82)
copy('pillars-wide.webp', 1800, 82)
copy('pillars-tall.webp', 1300, 82)

W = 320
H = round(W * 4000 / 2309)
a = np.asarray(im.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255.0
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b


def blur(x, radius):
    img = Image.fromarray(np.clip(x * 255, 0, 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) / 255.0


def smooth(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


warm = smooth((r - b) * 1.6 + 0.12, 0.05, 0.6)
dense = warm * (0.75 + 0.25 * smooth(0.5 - lum, 0.0, 0.4))
depth = 0.12 + 0.88 * smooth(blur(dense, 3), 0.05, 0.75)
depth = blur(depth, 1)

red = smooth(r - np.maximum(g, b) * 1.9, 0.06, 0.28) * smooth(r, 0.45, 0.8)
red = np.clip(red - blur(red, 8) * 0.6, 0, 1)
glow = np.clip(blur(red, 1.5) * 2.5, 0, 1)

maps = np.stack([depth, glow, np.zeros_like(depth)], axis=-1)
Image.fromarray(np.clip(maps * 255, 0, 255).astype(np.uint8)).save(out / 'pillars-maps.png', optimize=True)
for f in ('pillars-max.webp', 'pillars-wide.webp', 'pillars-tall.webp', 'pillars-maps.png'):
    print(f'[pillars] {out / f}')
