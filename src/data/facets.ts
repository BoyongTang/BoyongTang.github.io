// Four parts of Boyong, each sitting on a place in the Pillars of Creation where stars are born
// (src/data/pillars.ts). Entering one opens its star map: every star there is something real from
// src/data/profile.ts or the content collections.
// A part with little in it simply has few stars; nothing is invented to fill the sky.
//
// No Astro imports here, so scripts/make-og.mjs can use it directly.

export type FacetId = 'research' | 'intro' | 'works' | 'contact';

export interface Facet {
  id: FacetId;
  code: string;
  name: string;
  nameZh: string;
  /** One line of UI copy under the name. */
  line: string;
  /** The nebula's light: main glow and a second, deeper tone. */
  color: string;
  deep: string;
  seed: number;
}

export const facets: Facet[] = [
  { id: 'research', code: 'N-01', name: 'Research', nameZh: '研究', line: 'What I study.', color: '#a9cbff', deep: '#3d5ea8', seed: 41 },
  { id: 'intro', code: 'N-02', name: 'Intro', nameZh: '个人介绍', line: 'Who I am.', color: '#ff8f7d', deep: '#8a3040', seed: 17 },
  { id: 'works', code: 'N-03', name: 'Works', nameZh: '作品', line: 'What I have made.', color: '#8fe3d2', deep: '#2a7468', seed: 29 },
  { id: 'contact', code: 'N-04', name: 'Contact', nameZh: '联系', line: 'How to reach me.', color: '#cdbcff', deep: '#5a4699', seed: 89 },
];

/** A nebula's star map world, in its own units. */
export const WORLD = { w: 2400, h: 1600 };

export const facetById = new Map(facets.map((f) => [f.id, f]));
