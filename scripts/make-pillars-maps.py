"""Make the living-pillars textures in public/sky/ from Webb's original weic2216b.jpg (2309 x 4000).

  python3 scripts/make-pillars-maps.py path/to/weic2216b.jpg

Writes
  pillars-full.webp  the whole image, 1600 px wide: the texture on wide screens
  pillars-maps.png   320 px wide, masks the renderer reads (src/scripts/pillars-gl.ts):
                     R  depth: 1 at the dense near pillars, low in the far blue haze
                     G  glow: the red, star-forming knots at the pillar tips (they pulse)
                     (stars are found in the shader itself, from the photo's local contrast)

The masks are estimated from colour alone (the pillars are warm, the haze is blue); they only need to
be smooth and roughly right to give the photo depth and life.
Credit: NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI). CC BY 4.0.
Needs numpy and Pillow.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / 'public' / 'sky'
out.mkdir(parents=True, exist_ok=True)

im = Image.open(src).convert('RGB')
assert im.size == (2309, 4000), f'expected 2309 x 4000, got {im.size}'

full = im.resize((1600, round(1600 * 4000 / 2309)), Image.LANCZOS)
full.save(out / 'pillars-full.webp', quality=78, method=6)

W = 320
H = round(W * 4000 / 2309)
small = im.resize((W, H), Image.LANCZOS)
a = np.asarray(small).astype(np.float32) / 255.0
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b


def blur(x, radius):
    img = Image.fromarray(np.clip(x * 255, 0, 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) / 255.0


def smooth(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


# depth: warm dust is near, blue haze is far; dense (dark) dust inside the pillars is nearest
warm = smooth((r - b) * 1.6 + 0.12, 0.05, 0.6)
dense = warm * (0.75 + 0.25 * smooth(0.5 - lum, 0.0, 0.4))
depth = blur(dense, 3)
depth = 0.12 + 0.88 * smooth(depth, 0.05, 0.75)
depth = blur(depth, 1)

# glow: the red knots (strong red, little green or blue)
red = smooth(r - np.maximum(g, b) * 1.9, 0.06, 0.28) * smooth(r, 0.45, 0.8)
red = np.clip(red - blur(red, 8) * 0.6, 0, 1)  # knots, not whole reddish slopes
glow = np.clip(blur(red, 1.5) * 2.5, 0, 1)

maps = np.stack([depth, glow, np.zeros_like(depth)], axis=-1)
Image.fromarray(np.clip(maps * 255, 0, 255).astype(np.uint8)).save(out / 'pillars-maps.png', optimize=True)
print(f'[pillars] {out / "pillars-full.webp"}')
print(f'[pillars] {out / "pillars-maps.png"} ({W} x {H})')
