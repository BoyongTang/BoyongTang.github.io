// Decorative stars, generated from fixed seeds so the sky is the same on every visit.
// No Astro imports here, so scripts/make-og.mjs can use it directly.
import type { Galaxy, Hue } from '../data/galaxies';

/** mulberry32 — the same seed gives the same sky on every visit. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
  tint: boolean;
}

export const hueColor: Record<Hue, string> = {
  cyan: '#82d0dc',
  gold: '#e9c18f',
  green: '#8fc3b4',
  star: '#dfeef0',
};

/**
 * The stars of one galaxy, in sky coordinates.
 * `detail` is the fine, dense layer drawn only once a visitor is inside the galaxy.
 */
export function galaxyStars(g: Galaxy, { detail = false } = {}): Star[] {
  const rand = seeded(g.seed * (detail ? 104729 : 7919));
  const gauss = () => {
    const u = rand() || 1e-9;
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  const rot = (g.rotation * Math.PI) / 180;
  const pts: { u: number; v: number; d: number }[] = [];
  const n = Math.round(g.r * (g.form === 'spiral' ? 1.9 : 1.6) * (detail ? 2.6 : 1));

  // bulge, shared by every form
  for (let i = 0; i < n * 0.22; i++) {
    const u = gauss() * 0.13;
    const v = gauss() * 0.13;
    pts.push({ u, v, d: Math.hypot(u, v) });
  }

  for (let i = 0; i < n; i++) {
    if (g.form === 'spiral') {
      const arms = g.arms ?? 2;
      const t = Math.pow(rand(), 0.75);
      const a = (2 * Math.PI * (i % arms)) / arms + t * 3.4 + gauss() * (0.32 * (1 - t) + 0.12);
      const rr = 0.08 + t * 0.92;
      pts.push({ u: Math.cos(a) * rr, v: Math.sin(a) * rr, d: rr });
    } else if (g.form === 'ring') {
      const a = rand() * Math.PI * 2;
      const rr = 0.68 + gauss() * 0.07;
      pts.push({ u: Math.cos(a) * rr, v: Math.sin(a) * rr, d: rr });
    } else {
      const u = gauss() * 0.4;
      const v = gauss() * 0.4;
      pts.push({ u, v, d: Math.hypot(u, v) });
    }
  }

  return pts
    .filter((p) => p.d < 1.15)
    .map((p) => {
      const sx = p.u * g.r;
      const sy = p.v * g.r * g.tilt;
      const near = Math.max(0, 1 - p.d);
      return {
        x: +(g.x + sx * Math.cos(rot) - sy * Math.sin(rot)).toFixed(1),
        y: +(g.y + sx * Math.sin(rot) + sy * Math.cos(rot)).toFixed(1),
        r: +((detail ? 0.14 + rand() * 0.3 + near * 0.2 : 0.35 + rand() * 0.55 + near * 0.5)).toFixed(2),
        o: +((detail ? 0.2 + rand() * 0.45 : 0.25 + rand() * 0.35) + near * 0.4).toFixed(2),
        tint: rand() < 0.2,
      };
    });
}

/** Faint background stars between galaxies: no data, not clickable. */
export function ambientStars(count: number, seed = 103, w = 1000, h = 700) {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: +(rand() * w).toFixed(1),
    y: +(rand() * h).toFixed(1),
    r: +(0.3 + rand() * 0.6).toFixed(2),
    o: +(0.12 + rand() * 0.35).toFixed(2),
    twinkle: rand() > 0.9 ? Math.floor(rand() * 3) + 1 : 0,
  }));
}


/**
 * Where the i-th result of a galaxy sits: a golden-angle spiral inside the disc, so results never
 * overlap and keep their place as more are added. Position carries no meaning beyond "in this field".
 */
export function resultPositions(g: Galaxy, n: number) {
  const rot = (g.rotation * Math.PI) / 180;
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const a = i * golden + 0.6;
    const rr = g.r * (0.55 + 0.35 * ((i + 0.5) / Math.max(n, 4)));
    const sx = Math.cos(a) * rr;
    const sy = Math.sin(a) * rr * Math.max(g.tilt, 0.55);
    const x = g.x + sx * Math.cos(rot) - sy * Math.sin(rot);
    const y = g.y + sx * Math.sin(rot) + sy * Math.cos(rot);
    return { x: +x.toFixed(1), y: +y.toFixed(1), side: x >= g.x ? ('right' as const) : ('left' as const) };
  });
}
