// The star band's shape, shared by the home page markup (where the nebulae sit without JavaScript) and
// the canvas that paints the band. A gentle curve from the lower left to the upper right, in fractions
// of the screen; tall screens get a steeper one.

export type Pt = readonly [number, number];
export type Band = readonly [Pt, Pt, Pt];

export const BANDS: Record<'wide' | 'tall', Band> = {
  wide: [
    [-0.06, 0.98],
    [0.48, 0.7],
    [1.06, 0.06],
  ],
  tall: [
    [-0.04, 1.02],
    [0.4, 0.72],
    [1.04, 0.3],
  ],
};

/** Reference screens used for the no-JavaScript layout; the script refits to the real one. */
export const REF = { wide: { w: 1440, h: 820 }, tall: { w: 390, h: 760 } };

export const bandFor = (w: number, h: number): Band => (w / Math.max(1, h) >= 0.9 ? BANDS.wide : BANDS.tall);

/** A point on the band's centre line, in pixels. */
export function bandAt(b: Band, t: number, w: number, h: number): [number, number] {
  const [a, c, e] = b;
  const u = 1 - t;
  return [(u * u * a[0] + 2 * u * t * c[0] + t * t * e[0]) * w, (u * u * a[1] + 2 * u * t * c[1] + t * t * e[1]) * h];
}

/** Unit normal of the band at t, in pixels (points to the upper left side). */
export function bandNormal(b: Band, t: number, w: number, h: number): [number, number] {
  const [a, c, e] = b;
  const dx = (2 * (1 - t) * (c[0] - a[0]) + 2 * t * (e[0] - c[0])) * w;
  const dy = (2 * (1 - t) * (c[1] - a[1]) + 2 * t * (e[1] - c[1])) * h;
  const l = Math.hypot(dx, dy) || 1;
  return [dy / l, -dx / l];
}

/** Half-width of the bright band, in pixels. */
export const bandWidth = (w: number, h: number) => 0.11 * Math.min(w, h) + 0.035 * Math.max(w, h);

/** Where a nebula sits: on the band at t, pushed `side` (−1…1) of a half-width off its centre line. */
export function spotAt(b: Band, t: number, side: number, w: number, h: number): [number, number] {
  // on tall screens keep the nebulae off the very ends of the band (the corners hold the name and links)
  if (b === BANDS.tall) t = 0.2 + t * 0.74;
  const [x, y] = bandAt(b, t, w, h);
  const [nx, ny] = bandNormal(b, t, w, h);
  const s = side * bandWidth(w, h) * 0.55;
  return [x + nx * s, y + ny * s];
}
