// The parts of me, each on a place in the Pillars of Creation where stars are born
// (src/data/pillars.ts). Opening one unfolds its stars, which are written in src/data/stars.ts.
//
// No Astro imports here, so scripts/make-og.mjs can use it directly.

export type FacetId = 'research' | 'intro' | 'works' | 'contact' | 'honors' | 'news';

export interface Facet {
  id: FacetId;
  code: string;
  name: string;
  nameZh: string;
  /** One line of UI copy under the name. */
  line: string;
  /** The part's light: main glow and a second, deeper tone. */
  color: string;
  deep: string;
  seed: number;
}

export const facets: Facet[] = [
  { id: 'research', code: 'N-01', name: 'Research', nameZh: '研究', line: 'What I study.', color: '#a9cbff', deep: '#3d5ea8', seed: 41 },
  { id: 'intro', code: 'N-02', name: 'Intro', nameZh: '个人介绍', line: 'Who I am.', color: '#ff8f7d', deep: '#8a3040', seed: 17 },
  { id: 'works', code: 'N-03', name: 'Works', nameZh: '作品', line: 'What I have made.', color: '#8fe3d2', deep: '#2a7468', seed: 29 },
  { id: 'contact', code: 'N-04', name: 'Contact', nameZh: '联系', line: 'How to reach me.', color: '#cdbcff', deep: '#5a4699', seed: 89 },
  { id: 'honors', code: 'N-05', name: 'Honors', nameZh: '荣誉', line: 'What I have won.', color: '#ffd27a', deep: '#8a6420', seed: 53 },
  { id: 'news', code: 'N-06', name: 'News', nameZh: '动态', line: 'What is new.', color: '#c6f28c', deep: '#4d7a23', seed: 67 },
];

/** The part that opens your profile (src/data/profile.ts) as one card, instead of stars. */
export const PROFILE_PART = 'intro' satisfies FacetId;

/** The units a part's stars are laid out in. */
export const WORLD = { w: 2400, h: 1600 };

export const facetById = new Map(facets.map((f) => [f.id, f]));
