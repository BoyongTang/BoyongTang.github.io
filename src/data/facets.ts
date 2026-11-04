// The star band on the home page holds five nebulae, one per part of Boyong. Entering a nebula opens its
// star map: every star there is something real from src/data/profile.ts or the content collections.
// A part with little in it simply has few stars; nothing is invented to fill the sky.
//
// No Astro imports here, so scripts/make-og.mjs can use it directly.

export type FacetId = 'research' | 'toolbox' | 'path' | 'works' | 'contact';

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
  /** Place along the band, 0 (lower left) to 1 (upper right), and a small sideways nudge (−1…1). */
  t: number;
  side: number;
  seed: number;
}

export const facets: Facet[] = [
  { id: 'research', code: 'N-01', name: 'Research', nameZh: '研究', line: 'What I study.', color: '#9cc4ff', deep: '#3d5ea8', t: 0.16, side: 0.55, seed: 41 },
  { id: 'toolbox', code: 'N-02', name: 'Toolbox', nameZh: '工具', line: 'What I work with.', color: '#ffb27a', deep: '#a0502a', t: 0.34, side: -0.6, seed: 73 },
  { id: 'path', code: 'N-03', name: 'Path', nameZh: '经历', line: 'Where I have been.', color: '#ff9fb4', deep: '#8a3552', t: 0.52, side: 0.5, seed: 17 },
  { id: 'works', code: 'N-04', name: 'Works', nameZh: '作品', line: 'What I have made.', color: '#8fe3d2', deep: '#2a7468', t: 0.7, side: -0.55, seed: 29 },
  { id: 'contact', code: 'N-05', name: 'Contact', nameZh: '联系', line: 'How to reach me.', color: '#cdbcff', deep: '#5a4699', t: 0.87, side: 0.45, seed: 89 },
];

/** A nebula's star map world, in its own units. */
export const WORLD = { w: 2400, h: 1600 };

export const facetById = new Map(facets.map((f) => [f.id, f]));

/**
 * Constellation lines: declared relations between stars, by item id (see src/lib/sky.ts for the ids).
 * A line whose ends are not both in the sky is dropped, so lines can be declared before a star exists.
 */
export const constellations: Record<FacetId, [string, string][]> = {
  research: [
    ['current', 'active-learning'],
    ['current', 'machine-learning-for-materials'],
    ['active-learning', 'bayesian-optimization'],
    ['bayesian-optimization', 'surrogate-models-uncertainty'],
    ['surrogate-models-uncertainty', 'trustworthy-evaluation'],
  ],
  // DeepChem builds on RDKit; the rest are Python libraries and tools
  toolbox: [
    ['python', 'jupyter'],
    ['python', 'scikit-learn'],
    ['python', 'rdkit'],
    ['rdkit', 'deepchem'],
  ],
  path: [['edu-1', 'chengdu']],
  works: [],
  contact: [
    ['email', 'github'],
    ['github', 'about'],
  ],
};
