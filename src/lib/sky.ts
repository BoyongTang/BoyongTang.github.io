// What each part holds: the stars written in src/data/stars.ts, and where they sit on the part's star map.
import { facets, WORLD, type Facet, type FacetId } from '../data/facets';
import { stars as input } from '../data/stars';
import { seeded } from './stars';

export interface SkyLink {
  label: string;
  href: string;
  external: boolean;
}

export interface SkyItem {
  id: string;
  name: string;
  nameZh?: string;
  /** What kind of star this is, e.g. Paper, Project. */
  kind: string;
  /** The chain (field) it belongs to, e.g. AI4S. */
  chain?: string;
  /** Short line under the name on the map. */
  sub?: string;
  /** A paragraph in the star's card. */
  text?: string;
  facts?: { label: string; value: string }[];
  list?: string[];
  tags?: string[];
  links?: SkyLink[];
  /** 1 is brightest. */
  mag: 1 | 2;
  lang?: string;
  /** Which side of the star its label runs. */
  side: 'left' | 'right';
  x: number;
  y: number;
  /** The same star in the layout for tall (portrait) screens. */
  tall: { x: number; y: number; side: 'left' | 'right' };
}

/** A chain's name on the map, just above its stars. */
export interface SkyChain {
  id: string;
  name: string;
  nameZh?: string;
  x: number;
  y: number;
  side: 'left' | 'right';
  tall: { x: number; y: number; side: 'left' | 'right' };
}

export interface SkyFacet extends Facet {
  items: SkyItem[];
  lines: [SkyItem, SkyItem][];
  chains: SkyChain[];
  /** Default framing of the map, in world units, for wide and for tall screens. */
  view: { x: number; y: number; w: number; h: number };
  tallView: { x: number; y: number; w: number; h: number };
}

export { WORLD };

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/\+\+/g, 'pp')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const link = (label: string, href: string): SkyLink => ({ label, href, external: /^(https?:|mailto:)/.test(href) });
type Draft = Omit<SkyItem, 'x' | 'y' | 'mag' | 'side' | 'tall'> & { mag?: 1 | 2 };
interface Chain {
  id: string;
  name?: string;
  nameZh?: string;
  /** Its stars, as indexes into the part's drafts. */
  idx: number[];
}

/**
 * A part's stars, lines and chains from src/data/stars.ts. In a chain each star joins the one listed
 * before it, or, with `from`, an earlier star of the chain by name. An unknown `from` stops the build.
 */
function build(id: FacetId) {
  const ds: Draft[] = [];
  const edges: [number, number][] = [];
  const chains: Chain[] = [];
  const seen = new Set<string>();
  // a star's id must be unique on the whole page: a name also used in another part gets this part's name
  // in front (e.g. KolTa in both Research and Works: research-kolta, works-kolta)
  const elsewhere = new Set(
    (Object.keys(input) as FacetId[]).filter((o) => o !== id).flatMap((o) => input[o].flatMap((c) => c.stars.map((st) => slug(st.name)))),
  );
  input[id].forEach((c, gi) => {
    const idx: number[] = [];
    const byName = new Map<string, number>();
    c.stars.forEach((st, k) => {
      let sid = slug(st.name) || `${id}-${gi + 1}-${k + 1}`;
      if (elsewhere.has(sid)) sid = `${id}-${sid}`;
      while (seen.has(sid)) sid += `-${gi + 1}`;
      seen.add(sid);
      const links = [...(st.link ? [link(st.link.startsWith('mailto:') ? 'Write an email' : 'Open', st.link)] : []), ...(st.links ?? []).map((l) => link(l.label, l.href))];
      const i = ds.length;
      ds.push({
        id: sid,
        name: st.name,
        nameZh: st.zh,
        kind: st.kind ?? '',
        chain: c.chain,
        sub: st.note,
        text: st.text,
        links: links.length ? links : undefined,
        mag: st.bright ? 1 : undefined,
      });
      if (st.from) {
        const j = byName.get(st.from.trim().toLowerCase());
        if (j === undefined)
          throw new Error(`src/data/stars.ts, ${id}: '${st.name}' says from: '${st.from}', but no earlier star in the chain${c.chain ? ` '${c.chain}'` : ''} is called that.`);
        edges.push([j, i]);
      } else if (idx.length) edges.push([idx[idx.length - 1], i]);
      byName.set(st.name.trim().toLowerCase(), i);
      idx.push(i);
    });
    if (idx.length) chains.push({ id: `chain-${gi + 1}`, name: c.chain, nameZh: c.zh, idx });
  });
  return { ds, edges, chains };
}

/** Rough width of a star's label, in world units (name at 21–25, the mono line under it at 12.5). */
const labelWidth = (d: Draft, mag: 1 | 2) =>
  36 + Math.max(d.name.length * (mag === 1 ? 13.5 : 11.5), (d.kind.length + (d.sub ? d.sub.length + 3 : 0)) * 9.6);

/**
 * Lay a chain's stars out as a constellation. From the brightest star, walk the declared lines outward:
 * a chain zig-zags on, a fork fans out, so lines do not cross. Stars without lines sit round the figure.
 * Then labels are nudged apart. No randomness beyond the seed: the map is the same on every build.
 */
function place(widths: number[], edges: [number, number][], seed: number, tall: boolean) {
  const n = widths.length;
  const rand = seeded(seed);
  const adj = widths.map((_, i) => edges.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])));
  const pos = widths.map(() => ({ x: 0, y: 0, side: 'right' as 'left' | 'right' }));
  const seen = new Set<number>();
  const L = 330;

  const walk = (i: number, dir: number, depth: number) => {
    const kids = adj[i].filter((j) => !seen.has(j));
    kids.forEach((j) => seen.add(j));
    kids.forEach((j, k) => {
      const a =
        depth === 0
          ? dir + (k * 2 * Math.PI) / Math.max(1, kids.length)
          : dir + (kids.length === 1 ? (depth % 2 ? 0.55 : -0.55) : (k - (kids.length - 1) / 2) * 0.95);
      // tall screens: the figure runs down the screen and stays narrow
      pos[j].x = pos[i].x + Math.cos(a) * L * (tall ? 0.5 : 1);
      pos[j].y = pos[i].y + Math.sin(a) * L * (tall ? 0.72 : 0.8);
      walk(j, a, depth + 1);
    });
  };

  // the largest figure first, from its most connected star
  const order = widths.map((_, i) => i).sort((a, b) => adj[b].length - adj[a].length || a - b);
  const loose: number[] = [];
  let first = true;
  for (const i of order) {
    if (seen.has(i)) continue;
    if (!first && !adj[i].length) {
      loose.push(i);
      seen.add(i);
      continue;
    }
    seen.add(i);
    if (first) walk(i, tall ? 1.15 : -0.45, 0);
    else {
      // a second figure: to the lower left of the first
      const xs = pos.filter((_, k) => seen.has(k)).map((p) => p.x);
      pos[i].x = tall ? 0 : Math.min(...xs) - 120;
      pos[i].y = tall ? Math.max(...pos.filter((_, k) => seen.has(k)).map((p) => p.y)) + 300 : 420;
      walk(i, 0.4, 0);
    }
    first = false;
  }
  // stars without lines: round the figure, starting below it
  if (loose.length) {
    const placed = pos.filter((_, k) => !loose.includes(k));
    const cx = placed.reduce((s, p) => s + p.x, 0) / placed.length;
    const cy = placed.reduce((s, p) => s + p.y, 0) / placed.length;
    const R = Math.max(380, ...placed.map((p) => Math.hypot(p.x - cx, (p.y - cy) * 1.25))) + 240;
    loose.forEach((i, k) => {
      const a = Math.PI * 0.6 + (k * 2 * Math.PI) / Math.max(5, loose.length) + rand() * 0.2;
      pos[i].x = cx + Math.cos(a) * R * (tall ? 0.45 : 1);
      pos[i].y = cy + Math.sin(a) * R * (tall ? 1 : 0.7);
    });
  }

  // labels run right, unless a linked star sits in the way
  for (let i = 0; i < n; i++) {
    const blocked = adj[i].some((j) => pos[j].x > pos[i].x && pos[j].x < pos[i].x + widths[i] + 40 && Math.abs(pos[j].y - pos[i].y) < 110);
    pos[i].side = blocked ? 'left' : 'right';
  }

  // nudge apart any two stars whose labels overlap
  const box = (i: number) => {
    const p = pos[i];
    return p.side === 'right' ? [p.x - 26, p.x + widths[i] + 10, p.y - 40, p.y + 36] : [p.x - widths[i] - 10, p.x + 26, p.y - 40, p.y + 36];
  };
  for (let it = 0; it < 200; it++) {
    let moved = false;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const [a0, a1, a2, a3] = box(i);
        const [b0, b1, b2, b3] = box(j);
        const ox = Math.min(a1, b1) - Math.max(a0, b0);
        const oy = Math.min(a3, b3) - Math.max(a2, b2);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        // the cheaper way out: usually up or down
        if (oy < ox) {
          const d = (oy / 2 + 2) * (pos[i].y <= pos[j].y ? 1 : -1);
          pos[i].y -= d;
          pos[j].y += d;
        } else {
          const d = (ox / 2 + 2) * (pos[i].x <= pos[j].x ? 1 : -1);
          pos[i].x -= d;
          pos[j].x += d;
        }
      }
    if (!moved) break;
  }
  return pos;
}

/** Rough width of a chain's name on the map. */
const chainWidth = (c: Chain) => (c.name ? 30 + c.name.length * 17 + (c.nameZh ? c.nameZh.length * 17 + 24 : 0) : 0);

/**
 * One layout, centred in the world, with the view that frames it (labels included). Each chain is laid out
 * as its own constellation; on wide screens they sit two to a row, on tall ones one under another. A
 * chain's name sits just above its stars.
 */
function arrange(widths: number[], edges: [number, number][], chains: Chain[], seed: number, tall: boolean) {
  if (!widths.length) {
    const w = tall ? 560 : 1100;
    const h = tall ? 900 : 760;
    return { pos: [], labels: [], view: { x: WORLD.w / 2 - w / 2, y: WORLD.h / 2 - h / 2, w, h } };
  }
  // each chain on its own, at the origin
  const figs = chains.map((c, gi) => {
    const local = new Map(c.idx.map((g, l) => [g, l]));
    const sub = edges.filter(([a, b]) => local.has(a) && local.has(b)).map(([a, b]) => [local.get(a)!, local.get(b)!] as [number, number]);
    const p = place(c.idx.map((i) => widths[i]), sub, seed + gi * 7, tall);
    const wOf = (l: number) => widths[c.idx[l]];
    const bx0 = Math.min(...p.map((q, l) => q.x - (q.side === 'left' ? wOf(l) : 0)));
    const bx1 = Math.max(...p.map((q, l) => q.x + (q.side === 'right' ? wOf(l) : 0)), bx0 + chainWidth(c));
    const by0 = Math.min(...p.map((q) => q.y));
    const by1 = Math.max(...p.map((q) => q.y));
    return { c, p, bx0, bx1, by0, by1, top: by0 - (c.name ? 110 : 0) };
  });

  // the chains in rows of `cols`; returns where everything goes and the frame round it (labels included)
  const lay = (cols: number) => {
    const raw = widths.map(() => ({ x: 0, y: 0, side: 'right' as 'left' | 'right' }));
    const labels: { x: number; y: number }[] = [];
    let rowX = 0;
    let rowY = 0;
    let rowH = 0;
    figs.forEach((g, gi) => {
      if (gi > 0 && gi % cols === 0) {
        rowX = 0;
        rowY += rowH + 150;
        rowH = 0;
      }
      const dx = rowX - g.bx0;
      const dy = rowY - g.top;
      g.p.forEach((q, l) => (raw[g.c.idx[l]] = { x: q.x + dx, y: q.y + dy, side: q.side }));
      labels.push({ x: g.bx0 + dx, y: g.by0 - 75 + dy });
      rowX += g.bx1 - g.bx0 + 200;
      rowH = Math.max(rowH, g.by1 - g.top);
    });
    const idx = raw.map((_, i) => i);
    const named = figs.map((g, gi) => [g.c, labels[gi]] as const).filter(([c]) => c.name);
    const x0 = Math.min(...idx.map((i) => raw[i].x - (raw[i].side === 'left' ? widths[i] : 0)), ...named.map(([, l]) => l.x));
    const x1 = Math.max(...idx.map((i) => raw[i].x + (raw[i].side === 'right' ? widths[i] : 0)), ...named.map(([c, l]) => l.x + chainWidth(c)));
    const y0 = Math.min(...raw.map((q) => q.y), ...named.map(([, l]) => l.y)) - 45;
    const y1 = Math.max(...raw.map((q) => q.y)) + 50;
    return { raw, labels, x0: x0 - 30, x1: x1 + 30, y0, y1 };
  };

  // the arrangement that fits a typical screen of this shape best (the room src/scripts/explorer.ts gives it)
  const room = tall ? { w: 390 * 0.9 - 24, h: 720 - 140 } : { w: 1280 * 0.9 - 24, h: 760 - 140 };
  let best = lay(1);
  let bestK = 0;
  for (let cols = 1; cols <= (tall ? 1 : Math.min(3, figs.length)); cols++) {
    const L = lay(cols);
    const k = Math.min(room.w / (L.x1 - L.x0), room.h / (L.y1 - L.y0));
    if (k > bestK + 1e-6) {
      best = L;
      bestK = k;
    }
  }

  const { raw, labels, x0, x1, y0, y1 } = best;
  const ox = WORLD.w / 2 - (x0 + x1) / 2;
  const oy = WORLD.h / 2 - (y0 + y1) / 2;
  return {
    pos: raw.map((q) => ({ x: +(q.x + ox).toFixed(1), y: +(q.y + oy).toFixed(1), side: q.side })),
    labels: labels.map((l) => ({ x: +(l.x + ox).toFixed(1), y: +(l.y + oy).toFixed(1), side: 'right' as const })),
    view: { x: x0 + ox, y: y0 + oy, w: x1 - x0, h: y1 - y0 },
  };
}

export async function loadSky(): Promise<SkyFacet[]> {
  return facets.map((f) => {
    const { ds, edges, chains } = build(f.id);
    const degree = ds.map((_, i) => edges.filter((e) => e.includes(i)).length);
    const mags = ds.map((d, i) => d.mag ?? (degree[i] >= 3 ? 1 : 2));
    const widths = ds.map((d, i) => labelWidth(d, mags[i]));
    const wide = arrange(widths, edges, chains, f.seed, false);
    const tall = arrange(widths, edges, chains, f.seed, true);
    const items: SkyItem[] = ds.map((d, i) => ({ ...d, mag: mags[i], ...wide.pos[i], tall: tall.pos[i] }));
    const lines = edges.map(([a, b]) => [items[a], items[b]] as [SkyItem, SkyItem]);
    const named: SkyChain[] = chains
      .map((c, gi) => ({ c, gi }))
      .filter(({ c }) => c.name)
      .map(({ c, gi }) => ({ id: c.id, name: c.name!, nameZh: c.nameZh, ...wide.labels[gi], tall: tall.labels[gi] }));
    return { ...f, items, lines, chains: named, view: wide.view, tallView: tall.view };
  });
}
