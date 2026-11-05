"""4x AI upscale of an image with Real-ESRGAN, on the Mac's GPU (PyTorch, MPS) or the CPU.

  python3 scripts/upscale.py in.png out.png path/to/realesr-general-x4v3.pth   (compact model, 4.7 MB)
  python3 scripts/upscale.py in.png out.png path/to/RealESRGAN_x4plus.pth      (large model, 64 MB)

Weights: github.com/xinntao/Real-ESRGAN releases (BSD-3); they are not kept in the repository. Both networks
are defined here in plain PyTorch, so nothing else needs installing. The image is processed in overlapping
tiles so it fits in memory.
"""
import sys

import numpy as np
import torch
from PIL import Image
from torch import nn
from torch.nn import functional as F


class RDB(nn.Module):
    def __init__(self, nf=64, gc=32):
        super().__init__()
        self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1)
        self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
        self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
        self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, inplace=True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class RRDB(nn.Module):
    def __init__(self, nf=64, gc=32):
        super().__init__()
        self.rdb1 = RDB(nf, gc)
        self.rdb2 = RDB(nf, gc)
        self.rdb3 = RDB(nf, gc)

    def forward(self, x):
        return self.rdb3(self.rdb2(self.rdb1(x))) * 0.2 + x


class RRDBNet(nn.Module):
    def __init__(self, nf=64, nb=23, gc=32):
        super().__init__()
        self.conv_first = nn.Conv2d(3, nf, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(nf, gc) for _ in range(nb)])
        self.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_last = nn.Conv2d(nf, 3, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, inplace=True)

    def forward(self, x):
        feat = self.conv_first(x)
        feat = feat + self.conv_body(self.body(feat))
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode='nearest')))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode='nearest')))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))


class SRVGGNetCompact(nn.Module):
    """The compact network of realesr-general-x4v3: a plain stack of convolutions, then pixel shuffle."""

    def __init__(self, nf=64, nc=32, up=4):
        super().__init__()
        self.up = up
        body = [nn.Conv2d(3, nf, 3, 1, 1), nn.PReLU(num_parameters=nf)]
        for _ in range(nc):
            body += [nn.Conv2d(nf, nf, 3, 1, 1), nn.PReLU(num_parameters=nf)]
        body += [nn.Conv2d(nf, 3 * up * up, 3, 1, 1)]
        self.body = nn.ModuleList(body)
        self.upsampler = nn.PixelShuffle(up)

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return self.upsampler(out) + F.interpolate(x, scale_factor=self.up, mode='nearest')


def main():
    src, dst, weights = sys.argv[1], sys.argv[2], sys.argv[3]
    dev = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    state = torch.load(weights, map_location='cpu', weights_only=True)
    state = state.get('params_ema', state.get('params', state))
    net = RRDBNet() if 'conv_first.weight' in state else SRVGGNetCompact()
    net.load_state_dict(state, strict=True)
    net.eval().to(dev)

    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255.0
    h, w = im.shape[:2]
    x = torch.from_numpy(im).permute(2, 0, 1)[None]
    out = torch.zeros(1, 3, h * 4, w * 4)
    tile, pad = 256, 16
    with torch.no_grad():
        for y0 in range(0, h, tile):
            for x0 in range(0, w, tile):
                y1, x1 = min(y0 + tile, h), min(x0 + tile, w)
                py0, px0 = max(y0 - pad, 0), max(x0 - pad, 0)
                py1, px1 = min(y1 + pad, h), min(x1 + pad, w)
                part = net(x[:, :, py0:py1, px0:px1].to(dev)).cpu()
                oy, ox = (y0 - py0) * 4, (x0 - px0) * 4
                out[:, :, y0 * 4 : y1 * 4, x0 * 4 : x1 * 4] = part[:, :, oy : oy + (y1 - y0) * 4, ox : ox + (x1 - x0) * 4]
                print(f'[upscale] tile {y0},{x0}', flush=True)
    res = (out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8)
    Image.fromarray(res).save(dst)
    print(f'[upscale] {dst} {res.shape[1]} x {res.shape[0]}')


if __name__ == '__main__':
    main()
