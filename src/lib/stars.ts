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

/**
 * Star types, after the Event Horizon sky: most stars white, about a quarter icy blue, a few amber.
 * Bright stars are rare and carry a soft glow; the rest are faint pinpoints.
 */
export type StarKind = 'w' | 'b' | 'a';

export const starColor: Record<StarKind, string> = {
  w: '#f4f6ff',
  b: '#c2d9ff',
  a: '#ffa468',
};

/** Pick a kind from a 0–1 draw: `warm` share amber, `cool` share blue, the rest white. */
export const starKind = (x: number, warm = 0.12, cool = 0.28): StarKind => (x < warm ? 'a' : x < warm + cool ? 'b' : 'w');

/** Fill for a star: glowing stars use the shared gradients in StarGlow.astro (#sg-w, #sg-b, #sg-a). */
export const starFill = (s: { kind: StarKind; glow?: boolean }) => (s.glow ? `url(#sg-${s.kind})` : starColor[s.kind]);

export interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
  kind: StarKind;
  /** A rare bright star drawn with a soft halo (its r already includes the halo). */
  glow: boolean;
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
      const r = detail ? 0.14 + rand() * 0.3 + near * 0.2 : 0.35 + rand() * 0.55 + near * 0.5;
      const o = (detail ? 0.2 + rand() * 0.45 : 0.25 + rand() * 0.35) + near * 0.4;
      // like a real galaxy: an older, warmer core, younger blue stars out in the arms
      const kind = starKind(rand(), 0.05 + 0.25 * near * near, 0.1 + 0.34 * (1 - near));
      const glow = rand() < (detail ? 0.015 : 0.06);
      return {
        x: +(g.x + sx * Math.cos(rot) - sy * Math.sin(rot)).toFixed(1),
        y: +(g.y + sx * Math.sin(rot) + sy * Math.cos(rot)).toFixed(1),
        r: +(glow ? r * 3.4 : r).toFixed(2),
        o: +Math.min(1, glow ? o + 0.2 : o).toFixed(2),
        kind,
        glow,
      };
    });
}

/**
 * Background stars between galaxies: no data, not clickable. Two layers, as in the Event Horizon sky:
 * a sparse bright one (some with a glow, all gently shimmering) over a dense faint one.
 */
export function ambientStars(count: number, seed = 103, w = 1000, h = 700) {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => {
    const bright = rand() < 0.3;
    const x = +(rand() * w).toFixed(1);
    const y = +(rand() * h).toFixed(1);
    const r = bright ? 0.5 + rand() * 0.5 : 0.28 + rand() * 0.24;
    const o = bright ? 0.35 + rand() * 0.5 : 0.14 + rand() * 0.24;
    const kind = starKind(rand());
    const glow = bright && rand() < 0.2;
    return {
      x,
      y,
      r: +(glow ? r * 3.4 : r).toFixed(2),
      o: +o.toFixed(2),
      kind,
      glow,
      /** 1–3: a slow shimmer (bright stars only), each on its own period. */
      shimmer: bright ? 1 + Math.floor(rand() * 3) : 0,
      twinkle: rand() > 0.94 ? Math.floor(rand() * 3) + 1 : 0,
    };
  });
}

export interface Streak {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  o: number;
  kind: 'a' | 'b';
  /** Stream period (s) and start offset (s) for the outward drift. */
  dur: number;
  delay: number;
}

/**
 * Faint streaks of light sprayed outward from a galaxy's core, in its own plane: the Event Horizon's
 * radial streaks, scaled down. Mostly icy blue, about one in eight amber.
 */
export function galaxySpray(g: Galaxy, n = Math.round(g.r * 0.24)): Streak[] {
  const rand = seeded(g.seed * 3571);
  const rot = (g.rotation * Math.PI) / 180;
  const at = (a: number, t: number) => {
    const sx = Math.cos(a) * t * g.r;
    const sy = Math.sin(a) * t * g.r * g.tilt;
    return [g.x + sx * Math.cos(rot) - sy * Math.sin(rot), g.y + sx * Math.sin(rot) + sy * Math.cos(rot)];
  };
  return Array.from({ length: n }, () => {
    const a = rand() * Math.PI * 2;
    const t0 = 0.14 + rand() * 0.5;
    const len = 0.08 + rand() * 0.26;
    const [x1, y1] = at(a, t0);
    const [x2, y2] = at(a, t0 + len);
    const h = rand();
    return {
      x1: +x1.toFixed(1),
      y1: +y1.toFixed(1),
      x2: +x2.toFixed(1),
      y2: +y2.toFixed(1),
      o: +(0.12 + 0.4 * h * h).toFixed(2),
      kind: rand() < 0.13 ? ('a' as const) : ('b' as const),
      dur: +(4 + rand() * 5).toFixed(1),
      delay: -+(rand() * 9).toFixed(1),
    };
  });
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
