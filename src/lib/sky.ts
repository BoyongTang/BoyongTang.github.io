// What each nebula holds: stars made only from real content (src/data/profile.ts and the published
// research and notes), and where they sit on the nebula's star map.
import { constellations, facets, WORLD, type Facet, type FacetId } from '../data/facets';
import { galaxyById } from '../data/galaxies';
import { cvHref, profile, projects, publications } from '../data/profile';
import { seeded } from './stars';
import { publishedNotes, publishedResearch, statusLabel } from './universe';

export interface SkyLink {
  label: string;
  href: string;
  external: boolean;
}

export interface SkyItem {
  id: string;
  name: string;
  nameZh?: string;
  /** What kind of star this is, e.g. Interest, Tool, Project. */
  kind: string;
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

export interface SkyFacet extends Facet {
  items: SkyItem[];
  lines: [SkyItem, SkyItem][];
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
const fieldName = (id?: string) => (id ? galaxyById.get(id)?.name : undefined);
type Draft = Omit<SkyItem, 'x' | 'y' | 'mag' | 'side' | 'tall'> & { mag?: 1 | 2 };

async function drafts(): Promise<Record<FacetId, Draft[]>> {
  const research: Draft[] = [];
  const current = profile.bio.split(/(?<=\.)\s+/).slice(1).join(' ');
  if (current)
    research.push({ id: 'current', name: 'Active learning for materials science', kind: 'Current work', sub: 'Now', text: current, mag: 1 });
  for (const i of profile.interests) research.push({ id: slug(i), name: i, kind: 'Interest' });
  for (const e of await publishedResearch())
    research.push({
      id: slug(e.data.code),
      name: e.data.title,
      kind: 'Research',
      sub: `${e.data.code} · ${statusLabel(e.data.status)}`,
      text: e.data.summary,
      facts: [{ label: 'Question', value: e.data.question }, ...(fieldName(e.data.topic) ? [{ label: 'Field', value: fieldName(e.data.topic)! }] : [])],
      links: [link('Read the dossier', `/research/${e.id}/`)],
      mag: 1,
    });
  for (const p of publications)
    research.push({
      id: slug(p.id),
      name: p.title,
      kind: 'Publication',
      sub: `${p.year} · ${p.status.toUpperCase()}`,
      text: `${p.authors}. ${p.venue}.`,
      links: (p.links ?? []).map((l) => link(l.label, l.href)),
      mag: 1,
    });

  // the personal introduction: not written yet, so no stars for now
  const intro: Draft[] = [];

  const works: Draft[] = projects
    .filter((p) => !p.draft)
    .map((p) => ({
      id: slug(p.id),
      name: p.name,
      nameZh: p.nameZh,
      kind: 'Project',
      sub: `${p.code} · ${p.status.toUpperCase()}`,
      text: p.summary,
      list: p.scope,
      tags: p.tech,
      links: [link('Project page', `/projects/#${p.id}`), ...(p.repo ? [link('Repository', p.repo)] : [])],
      mag: 1,
    }));
  for (const n of await publishedNotes())
    works.push({
      id: slug(n.data.code),
      name: n.data.title,
      kind: 'Note',
      sub: `${n.data.code} · ${n.data.date.toISOString().slice(0, 10)}`,
      text: n.data.summary,
      links: [link('Read the note', `/notes/${n.id}/`)],
      lang: n.data.lang,
    });

  const contact: Draft[] = [
    { id: 'email', name: 'Email', kind: 'Contact', sub: profile.email, links: [link('Write an email', `mailto:${profile.email}`)], mag: 1 },
    ...profile.links
      .filter((l) => l.href)
      .map((l) => ({ id: slug(l.label), name: l.label, kind: 'Profile', sub: l.href.replace(/^https?:\/\/(www\.)?/, ''), links: [link(`Open ${l.label}`, l.href)] })),
    { id: 'about', name: profile.cv ? 'CV' : 'About & CV', kind: 'Page', sub: profile.cv ? 'PDF' : '/about/', links: [link(profile.cv ? 'Download the CV' : 'Open About', cvHref)] },
  ];

  return { research, intro, works, contact };
}

/** Rough width of a star's label, in world units (name at 21–25, the mono line under it at 12.5). */
const labelWidth = (d: Draft, mag: 1 | 2) =>
  36 + Math.max(d.name.length * (mag === 1 ? 13.5 : 11.5), (d.kind.length + (d.sub ? d.sub.length + 3 : 0)) * 9.6);

/**
 * Lay a nebula's stars out as a constellation. From the brightest star, walk the declared lines outward:
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

/** One layout, centred in the world, with the view that frames it (labels included). */
function arrange(widths: number[], edges: [number, number][], seed: number, tall: boolean) {
  if (!widths.length) {
    const w = tall ? 560 : 1100;
    const h = tall ? 900 : 760;
    return { pos: [], view: { x: WORLD.w / 2 - w / 2, y: WORLD.h / 2 - h / 2, w, h } };
  }
  const raw = place(widths, edges, seed, tall);
  const left = (i: number) => raw[i].x - (raw[i].side === 'left' ? widths[i] : 0);
  const right = (i: number) => raw[i].x + (raw[i].side === 'right' ? widths[i] : 0);
  const idx = raw.map((_, i) => i);
  const bx0 = Math.min(...idx.map(left));
  const bx1 = Math.max(...idx.map(right));
  const by0 = Math.min(...raw.map((p) => p.y));
  const by1 = Math.max(...raw.map((p) => p.y));
  const ox = WORLD.w / 2 - (bx0 + bx1) / 2;
  const oy = WORLD.h / 2 - (by0 + by1) / 2;
  const pos = raw.map((p) => ({ x: +(p.x + ox).toFixed(1), y: +(p.y + oy).toFixed(1), side: p.side }));
  // frame: room round the labels, and above for the title
  const x0 = bx0 + ox - (tall ? 70 : 160);
  const x1 = bx1 + ox + (tall ? 70 : 160);
  const y0 = by0 + oy - (tall ? 380 : 300);
  const y1 = by1 + oy + (tall ? 200 : 240);
  const w = Math.max(tall ? 560 : 1100, x1 - x0);
  const h = Math.max(tall ? 900 : 760, y1 - y0);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return { pos, view: { x: cx - w / 2, y: cy - h / 2, w, h } };
}

export async function loadSky(): Promise<SkyFacet[]> {
  const all = await drafts();
  return facets.map((f) => {
    const ds = all[f.id];
    const index = new Map(ds.map((d, i) => [d.id, i]));
    const edges = constellations[f.id]
      .filter(([a, b]) => index.has(a) && index.has(b))
      .map(([a, b]) => [index.get(a)!, index.get(b)!] as [number, number]);
    const degree = ds.map((_, i) => edges.filter((e) => e.includes(i)).length);
    const mags = ds.map((d, i) => d.mag ?? (degree[i] >= 3 ? 1 : 2));
    const widths = ds.map((d, i) => labelWidth(d, mags[i]));
    const wide = arrange(widths, edges, f.seed, false);
    const tall = arrange(widths, edges, f.seed, true);
    const items: SkyItem[] = ds.map((d, i) => ({ ...d, mag: mags[i], ...wide.pos[i], tall: tall.pos[i] }));
    const lines = edges.map(([a, b]) => [items[a], items[b]] as [SkyItem, SkyItem]);
    return { ...f, items, lines, view: wide.view, tallView: tall.view };
  });
}
