import { getCollection } from 'astro:content';
import { galaxies, galaxyById } from '../data/galaxies';
import { projects, publications } from '../data/profile';

/* ── results: the only things a galaxy holds ─────────────────── */

export type ResultKind = 'research' | 'publication' | 'project' | 'note';

export interface Result {
  kind: ResultKind;
  code: string;
  title: string;
  url: string;
  external: boolean;
  status: string;
  date?: Date;
  galaxy?: string;
  lang?: string;
}

export const kindLabel: Record<ResultKind, string> = {
  research: 'Research',
  publication: 'Publication',
  project: 'Project',
  note: 'Note',
};

export const statusLabel = (s: string) => s.replace(/_/g, ' ').toUpperCase();

/** Published entries only: drafts stay in the repo but are never built or linked. */
export const publishedResearch = () => getCollection('research', ({ data }) => !data.draft);
export const publishedNotes = () => getCollection('notes', ({ data }) => !data.draft);

/** Every published result, newest first. Refuses to build if a result names an unknown galaxy. */
export async function loadResults(): Promise<Result[]> {
  const out: Result[] = [];
  for (const e of await publishedResearch())
    out.push({ kind: 'research', code: e.data.code, title: e.data.title, url: `/research/${e.id}/`, external: false, status: e.data.status, date: e.data.updatedAt, galaxy: e.data.topic });
  for (const e of await publishedNotes())
    out.push({ kind: 'note', code: e.data.code, title: e.data.title, url: `/notes/${e.id}/`, external: false, status: 'note', date: e.data.date, galaxy: e.data.topic, lang: e.data.lang });
  for (const p of publications) {
    const href = p.links?.[0]?.href ?? '/publications/';
    out.push({ kind: 'publication', code: String(p.year), title: p.title, url: href, external: /^https?:/.test(href), status: p.status, date: new Date(`${p.year}-01-01`), galaxy: p.galaxy });
  }
  for (const p of projects.filter((p) => !p.draft))
    out.push({ kind: 'project', code: p.code, title: p.name, url: `/projects/#${p.id}`, external: false, status: p.status, galaxy: p.galaxy });

  const unknown = out.filter((r) => r.galaxy && !galaxyById.has(r.galaxy));
  if (unknown.length) throw new Error(`Unknown galaxy in: ${unknown.map((r) => `${r.code} (${r.galaxy})`).join(', ')}`);
  return out.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

export function resultsIn(results: Result[], id: string) {
  return results.filter((r) => r.galaxy === id);
}

export { ambientStars, galaxyStars, hueColor, resultPositions, seeded } from './stars';
export { galaxies };
