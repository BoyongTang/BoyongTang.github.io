"""Make every web copy of the Pillars of Creation in public/sky/ from the source picture
(assets-src/pillars-of-creation.webp, 736 x 1104, found on Pinterest).

  python3 scripts/make-pillars.py --weights path/to/realesr-general-x4v3.pth [assets-src/pillars-of-creation.webp]

The picture (without its baked-in title, its faintest sky stars thinned out) is upscaled 4x with Real-ESRGAN
(scripts/upscale.py; weights from github.com/xinntao/Real-ESRGAN releases v0.2.5.0, not kept here). Without
--weights it falls back to a plain 2x resize, which is much softer.

Writes
  pillars-max.webp   2600 px wide: the texture when zoomed in (kept under 4096 px, the largest texture many
                     GPUs take)
  pillars-wide.webp  1800 px wide: the texture on computers
  pillars-tall.webp  1300 px wide: the texture on phones, and the still image where there is no WebGL
  pillars-maps.png   320 px wide, masks the living sky reads (src/scripts/pillars-gl.ts):
                     R  depth: 1 at the dense near pillars, low in the far sky
                     G  glow: the brightest, warmest knots (they pulse)

Sizes and positions on the result are in src/data/pillars.ts (PILLARS.size, spots).
Needs numpy and Pillow.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parent.parent
args = sys.argv[1:]
weights = None
if '--weights' in args:
    i = args.index('--weights')
    weights = args[i + 1]
    del args[i : i + 2]
src = Path(args[0]) if args else root / 'assets-src' / 'pillars-of-creation.webp'
out = root / 'public' / 'sky'
out.mkdir(parents=True, exist_ok=True)

im = Image.open(src).convert('RGB')
assert im.size == (736, 1104), f'expected the 736 x 1104 picture, got {im.size}'
# the picture carries "PILLARS OF CREATION" near its foot: cut just above it
im = im.crop((0, 0, 736, 1030))

# a sparser sky: in the open dark, take out the faint stars and keep only the brighter ones
src_a = np.asarray(im).astype(np.float32) / 255.0
L = 0.2126 * src_a[..., 0] + 0.7152 * src_a[..., 1] + 0.0722 * src_a[..., 2]
Lb = np.asarray(Image.fromarray((L * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
openSky = np.clip((0.16 - Lb) / 0.1, 0, 1)  # dark surroundings: the sky, not the dust
point = L - np.asarray(Image.fromarray((L * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
faint = np.clip((point - 0.02) / 0.06, 0, 1) * np.clip((0.4 - L) / 0.14, 0, 1)
faint = np.asarray(Image.fromarray((faint * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
calm = np.asarray(im.filter(ImageFilter.MedianFilter(5))).astype(np.float32) / 255
k = (faint * openSky)[..., None]
im = Image.fromarray(np.clip((src_a * (1 - k) + np.minimum(calm, src_a) * k) * 255, 0, 255).astype(np.uint8))

# upscale: 4x with Real-ESRGAN when its weights are given, else a plain (soft) 2x
if weights:
    import subprocess
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:
        a_in, a_out = Path(tmp) / 'in.png', Path(tmp) / 'out.png'
        im.save(a_in)
        subprocess.run([sys.executable, str(root / 'scripts' / 'upscale.py'), str(a_in), str(a_out), weights], check=True)
        big = Image.open(a_out).convert('RGB')
else:
    big = im.resize((1472, 2060), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=45, threshold=4))


def copy(name, width, quality):
    big.resize((width, round(width * big.height / big.width)), Image.LANCZOS).save(out / name, quality=quality, method=6)


copy('pillars-max.webp', min(2600, big.width), 84)
copy('pillars-wide.webp', min(1800, big.width), 84)
copy('pillars-tall.webp', min(1300, big.width), 84)

# masks, worked out from colour: the dust is warm, the sky dark or teal
W = 320
H = round(W * 2060 / 1472)
a = np.asarray(im.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255.0
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b


def blur(x, radius):
    img = Image.fromarray(np.clip(x * 255, 0, 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) / 255.0


def smooth(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


warm = smooth((r - b) * 1.8 + 0.05, 0.05, 0.5) * smooth(lum, 0.03, 0.18)
# the sky here is nearly black: whatever stands clearly above it (stars aside) is dust or its glow
cloud = smooth(blur(lum, 2.5), 0.07, 0.24)
dense = np.maximum(warm, cloud * 0.8) * (0.85 + 0.15 * smooth(0.45 - lum, 0.0, 0.4))
depth = 0.12 + 0.88 * smooth(blur(dense, 3), 0.04, 0.7)
depth = blur(depth, 1)

hot = smooth(lum, 0.55, 0.85) * smooth(r - b, 0.1, 0.4)
glow = np.clip(blur(np.clip(hot - blur(hot, 6) * 0.5, 0, 1), 1.5) * 2.0, 0, 1)

maps = np.stack([depth, glow, np.zeros_like(depth)], axis=-1)
Image.fromarray(np.clip(maps * 255, 0, 255).astype(np.uint8)).save(out / 'pillars-maps.png', optimize=True)
for f in ('pillars-max.webp', 'pillars-wide.webp', 'pillars-tall.webp', 'pillars-maps.png'):
    print(f'[pillars] {out / f}')
