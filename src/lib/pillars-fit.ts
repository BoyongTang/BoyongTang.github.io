// Where the Pillars of Creation sit on a screen of a given size, and so where any point of the image lands.
// A chosen stretch of the image fills the screen's height (PILLARS.frame); the image is centred on a chosen
// point across. Where the screen is wider than the image, the sky continues past its edges.
// Shared by the home page markup (the layout without JavaScript) and its scripts (the real screen).
import { PILLARS } from '../data/pillars.ts';

export type Shape = 'wide' | 'tall';

export const shapeFor = (w: number, h: number): Shape => (w / Math.max(1, h) >= 0.9 ? 'wide' : 'tall');

export interface Fit {
  shape: Shape;
  /** Displayed size of the image and its top-left corner, in px. */
  iw: number;
  ih: number;
  ox: number;
  oy: number;
  /** A point of the full image (fractions) → screen px. */
  at: (x: number, y: number) => [number, number];
}

export function fitPillars(w: number, h: number, shape: Shape = shapeFor(w, h)): Fit {
  const { w: W, h: H } = PILLARS.size;
  const f = PILLARS.frame[shape];
  const s = h / ((f.y[1] - f.y[0]) * H);
  const iw = W * s;
  const ih = H * s;
  // centred on f.x; if the image is wider than the screen, never past its edges
  let ox = w / 2 - f.x * iw;
  if (iw >= w) ox = Math.min(0, Math.max(w - iw, ox));
  const oy = -f.y[0] * ih;
  return { shape, iw, ih, ox, oy, at: (x, y) => [ox + x * iw, oy + y * ih] };
}

/** The same placement as CSS object-position percentages (for the layout without JavaScript). */
export function objectPosition(fit: Fit, w: number, h: number) {
  const px = fit.iw > w ? (fit.ox / (w - fit.iw)) * 100 : 50;
  const py = fit.ih > h ? (fit.oy / (h - fit.ih)) * 100 : 50;
  return `${px.toFixed(2)}% ${py.toFixed(2)}%`;
}
