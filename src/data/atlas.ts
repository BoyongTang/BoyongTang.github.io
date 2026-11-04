// The research atlas: the only place where relations between pieces of work are declared.
//
//  · topics    — the constellations (research areas). x/y is where the topic label sits.
//  · nodes     — real, readable things. A node with `ref` takes its title, code, status and URL from
//                a research dossier or note in src/content/ (`ref: 'research/<slug>'` or 'notes/<slug>').
//                Nodes without `ref` must give their own title and url.
//  · edges     — declared relations. Every edge needs a sentence that explains it.
//
// Positions are a conceptual layout on a 1000 × 700 sky. They are versioned here on purpose, so the
// map never reshuffles between visits. They are not astronomical coordinates and not a ranking.
// Keep the top-right corner (x > 900, y < 150) clear: the zoom controls sit there.

export type NodeType = 'question' | 'method' | 'research' | 'note' | 'tool' | 'paper';
export type Relation = 'motivates' | 'uses' | 'evaluates' | 'produces' | 'documents' | 'extends' | 'related_to';
export type LabelSide = 'right' | 'left' | 'top' | 'bottom';

export interface Topic {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface AtlasNodeSpec {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label?: LabelSide;
  /** 'research/<slug>' or 'notes/<slug>' */
  ref?: string;
  code?: string;
  title?: string;
  /** Short label on the map (defaults to title). */
  short?: string;
  topic?: string;
  url?: string;
  summary?: string;
  status?: string;
  /** Visually emphasised as the current focus of work (not a measure of importance). */
  featured?: boolean;
}

export interface AtlasEdgeSpec {
  source: string;
  target: string;
  relation: Relation;
  description: string;
}

export const VIEW = { w: 1000, h: 700 };
/** Centre of the instrument rings. */
export const CENTRE = { x: 520, y: 360 };

export const topics: Topic[] = [
  { id: 'discovery', label: 'Data-efficient Discovery', x: 560, y: 92 },
  { id: 'evaluation', label: 'Trustworthy Evaluation', x: 180, y: 112 },
  { id: 'materials', label: 'Materials Science', x: 800, y: 664 },
  { id: 'teaching', label: 'Teaching ML', x: 230, y: 664 },
];

export const relationStyle: Record<Relation, { label: string; dash: string }> = {
  motivates: { label: 'motivates', dash: '7 6' },
  uses: { label: 'uses', dash: '' },
  evaluates: { label: 'evaluates', dash: '2 5' },
  produces: { label: 'produces', dash: '' },
  documents: { label: 'documents', dash: '1 5' },
  extends: { label: 'extends', dash: '12 4 2 4' },
  related_to: { label: 'related to', dash: '3 6' },
};

export const nodes: AtlasNodeSpec[] = [
  // ── Data-efficient discovery ─────────────────────────────
  { id: 'r-al', type: 'research', ref: 'research/active-learning-materials', short: 'Active learning for materials', x: 520, y: 360, label: 'bottom', featured: true },
  {
    id: 'q-labels', type: 'question', code: 'Q-001', title: 'How few labels can learn the whole map?', short: 'Fewest labels',
    topic: 'discovery', x: 390, y: 240, label: 'left', status: 'open',
    url: '/research/active-learning-materials/#question',
    summary: 'Learning a structure–property map, phase diagram or potential-energy surface with as few new labels as possible.',
  },
  {
    id: 'm-surrogate', type: 'method', code: 'M-01', title: 'Surrogate models', short: 'Surrogate models',
    topic: 'discovery', x: 660, y: 245, label: 'right', status: 'method',
    url: '/research/active-learning-materials/#approach',
    summary: 'GP, random forest, XGBoost, MLP and GNN models that predict a property with a mean μ(x) and an uncertainty σ(x).',
  },
  {
    id: 'm-query', type: 'method', code: 'M-02', title: 'Query strategies', short: 'Query strategies',
    topic: 'discovery', x: 655, y: 470, label: 'right', status: 'method',
    url: '/research/active-learning-materials/#approach',
    summary: 'Active-learning rules that pick what to label next: uncertainty, query-by-committee, representativeness, diversity.',
  },
  {
    id: 'm-acq', type: 'method', code: 'M-03', title: 'Acquisition functions (BO)', short: 'Acquisition (BO)',
    topic: 'discovery', x: 830, y: 345, label: 'bottom', status: 'method',
    url: '/notes/al-vs-bo/',
    summary: 'Bayesian-optimization rules aimed at the optimum, not the map: EI, PI, UCB, Thompson sampling, EHVI.',
  },
  {
    id: 'q-al-bo', type: 'question', code: 'Q-002', title: 'Learning the map, or finding the optimum?', short: 'Map or optimum?',
    topic: 'discovery', x: 760, y: 165, label: 'left', status: 'open',
    url: '/notes/al-vs-bo/',
    summary: 'Active learning and Bayesian optimization can share a surrogate, but not a goal or a metric.',
  },
  { id: 'n-al-bo', type: 'note', ref: 'notes/al-vs-bo', short: 'AL ≠ BO', x: 895, y: 225, label: 'bottom' },

  // ── Trustworthy evaluation ───────────────────────────────
  {
    id: 'm-eval', type: 'method', code: 'M-04', title: 'Leakage-free evaluation', short: 'Leakage-free evaluation',
    topic: 'evaluation', x: 268, y: 345, label: 'bottom', status: 'method',
    url: '/notes/evaluation-checklist/',
    summary: 'A fixed split, the same starting pool, several seeds and a model card for every reported number.',
  },
  {
    id: 'q-reproduce', type: 'question', code: 'Q-003', title: 'Does a published result survive a clean re-run?', short: 'Does it reproduce?',
    topic: 'evaluation', x: 170, y: 205, label: 'right', status: 'open',
    url: '/notes/evaluation-checklist/',
    summary: 'Whether a reported gain holds on the original data and code under one protocol, with several seeds.',
  },
  { id: 'n-eval', type: 'note', ref: 'notes/evaluation-checklist', short: 'Evaluation checklist', x: 95, y: 470, label: 'bottom' },

  // ── Materials science ────────────────────────────────────
  {
    id: 'q-transfer', type: 'question', code: 'Q-004', title: 'Can one loop move to a new material system?', short: 'Transferable loop',
    topic: 'materials', x: 840, y: 560, label: 'left', status: 'open',
    url: '/research/active-learning-materials/#next',
    summary: 'Whether a loop distilled from reproduced work carries over to other systems, such as adhesives.',
  },
  {
    id: 't-repro', type: 'tool', code: 'T-01', title: 'Reproduction of Active Learning in Materials Science', short: 'Reproduction repo',
    topic: 'materials', x: 600, y: 600, label: 'left', status: 'ongoing',
    url: '/projects/#t-01',
    summary: 'Executable reproduction paths, one loop and one evaluation protocol, and a manifest of run evidence. Not public yet.',
  },

  // ── Teaching ML ──────────────────────────────────────────
  {
    id: 't-course', type: 'tool', code: 'T-02', title: 'ML from Zero (course)', short: 'ML from Zero course',
    topic: 'teaching', x: 350, y: 560, label: 'right', status: 'ongoing',
    url: '/projects/#t-02',
    summary: 'A Chinese-language machine-learning course: intuition, derivations, data boundaries and reproducible evaluation.',
  },
  { id: 'n-course', type: 'note', ref: 'notes/ml-from-zero-principles', short: 'Course principles', x: 150, y: 600, label: 'top' },
];

export const edges: AtlasEdgeSpec[] = [
  { source: 'q-labels', target: 'r-al', relation: 'motivates', description: 'The project exists to answer this question.' },
  { source: 'r-al', target: 'm-surrogate', relation: 'uses', description: 'The surrogate supplies the mean and uncertainty the loop runs on.' },
  { source: 'r-al', target: 'm-query', relation: 'uses', description: 'A query strategy picks each next label.' },
  { source: 'm-surrogate', target: 'm-query', relation: 'related_to', description: 'GNN, RF and MLP are surrogates, not query strategies.' },
  { source: 'm-surrogate', target: 'm-acq', relation: 'related_to', description: 'Bayesian optimization can share the same surrogate; only the acquisition rule differs.' },
  { source: 'q-al-bo', target: 'm-query', relation: 'related_to', description: 'Query strategies serve the “learn the map” goal.' },
  { source: 'q-al-bo', target: 'm-acq', relation: 'related_to', description: 'Acquisition functions serve the “find the optimum” goal.' },
  { source: 'n-al-bo', target: 'q-al-bo', relation: 'documents', description: 'Note setting out the two goals and their metrics.' },

  { source: 'q-reproduce', target: 'm-eval', relation: 'motivates', description: 'Leakage-free protocols exist to answer this question.' },
  { source: 'r-al', target: 'm-eval', relation: 'uses', description: 'Every reproduced method is scored under one protocol.' },
  { source: 'n-eval', target: 'm-eval', relation: 'documents', description: 'The checklist behind the protocol.' },

  { source: 'q-transfer', target: 'r-al', relation: 'motivates', description: 'Reproduction is the first step towards a loop that transfers.' },
  { source: 'r-al', target: 't-repro', relation: 'produces', description: 'Reproduction paths and run evidence are kept in this repository.' },

  { source: 't-course', target: 'm-eval', relation: 'uses', description: 'The course teaches leakage-free comparison, multiple seeds and model cards.' },
  { source: 't-course', target: 'm-query', relation: 'related_to', description: 'Units 1–9 of the course cover active learning.' },
  { source: 'n-course', target: 't-course', relation: 'documents', description: 'What the course asks of every topic.' },
];
