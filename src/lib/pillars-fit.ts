// Where the Pillars of Creation sit on a screen of a given size, and so where any point of the image lands.
// The photo always covers the screen; a chosen point of it is kept near a chosen point of the screen.
// Shared by the home page markup (the layout without JavaScript) and its script (the real screen).
import { PILLARS } from '../data/pillars.ts';

export type Shape = 'wide' | 'tall';

/** Wider than this, wide screens show the photo at full height on the right. */
export const FRAMED = 1.18;

export const shapeFor = (w: number, h: number): Shape => (w / Math.max(1, h) >= 0.9 ? 'wide' : 'tall');

export interface Fit {
  shape: Shape;
  /** True when the photo stands at full height on the right instead of covering the screen. */
  framed: boolean;
  /** Displayed size of the photo and its top-left corner, in px. */
  iw: number;
  ih: number;
  ox: number;
  oy: number;
  /** A point of the full image (fractions) → screen px. */
  at: (x: number, y: number) => [number, number];
}

/** `shape` picks the web copy; by default the one the screen's shape would load. */
export function fitPillars(w: number, h: number, shape: Shape = shapeFor(w, h)): Fit {
  const v = PILLARS.variants[shape];
  const [x0, y0, x1, y1] = v.crop;
  const cw = (x1 - x0) * PILLARS.size.w;
  const ch = (y1 - y0) * PILLARS.size.h;
  const at = (s: number, ox: number, oy: number) => (x: number, y: number): [number, number] => [
    ox + (x - x0) * PILLARS.size.w * s,
    oy + (y - y0) * PILLARS.size.h * s,
  ];

  // wide screens: the pillars stand at full height on the right, unless that would not reach across
  // (the same as CSS object-fit: contain with object-position: right, so it also holds without JavaScript)
  if (shape === 'wide' && w / h > FRAMED) {
    const s = h / ch;
    const iw = cw * s;
    return { shape, framed: true, iw, ih: h, ox: w - iw, oy: 0, at: at(s, w - iw, 0) };
  }

  const s = Math.max(w / cw, h / ch);
  const iw = cw * s;
  const ih = ch * s;
  const f = PILLARS.focus[shape];
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const ox = clamp(f.to[0] * w - (f.at[0] - x0) * PILLARS.size.w * s, w - iw, 0);
  const oy = clamp(f.to[1] * h - (f.at[1] - y0) * PILLARS.size.h * s, h - ih, 0);
  return {
    shape,
    framed: false,
    iw,
    ih,
    ox,
    oy,
    at: at(s, ox, oy),
  };
}

/** The same placement as CSS object-position percentages (for the layout without JavaScript). */
export function objectPosition(fit: Fit, w: number, h: number) {
  const px = fit.iw > w ? (fit.ox / (w - fit.iw)) * 100 : 50;
  const py = fit.ih > h ? (fit.oy / (h - fit.ih)) * 100 : 50;
  return `${px.toFixed(2)}% ${py.toFixed(2)}%`;
}
