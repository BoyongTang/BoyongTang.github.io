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
export const CENTRE = { x: 540, y: 372 };

export const topics: Topic[] = [
  { id: 'discovery', label: 'Data-efficient Discovery', x: 540, y: 532 },
  { id: 'xai', label: 'Explainable AI', x: 150, y: 330 },
  { id: 'math', label: 'Mathematical Foundations', x: 905, y: 58 },
  { id: 'systems', label: 'Learning & Systems', x: 880, y: 668 },
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
  { id: 'r-al', type: 'research', ref: 'research/active-learning-formulation', short: 'Active Learning', x: 540, y: 372, label: 'bottom', featured: true },
  {
    id: 'q-discovery', type: 'question', code: 'Q-001', title: 'Which experiment should be run next?', short: 'Discovery efficiency',
    topic: 'discovery', x: 430, y: 280, label: 'left', status: 'open',
    url: '/research/active-learning-formulation/#question',
    summary: 'How to find rare high performers with as few expensive experiments as possible.',
  },
  {
    id: 'm-acquisition', type: 'method', code: 'M-01', title: 'Acquisition functions', short: 'Acquisition',
    topic: 'discovery', x: 668, y: 296, label: 'right', status: 'method',
    url: '/research/active-learning-formulation/#approach',
    summary: 'Rules that turn a model’s predictions and uncertainty into the next experiment to run.',
  },
  {
    id: 'm-uq', type: 'method', code: 'M-02', title: 'Uncertainty quantification', short: 'Uncertainty (UQ)',
    topic: 'discovery', x: 650, y: 470, label: 'right', status: 'method',
    url: '/research/active-learning-formulation/#approach',
    summary: 'Estimating how much a surrogate model’s prediction can be trusted, and calibrating it.',
  },
  { id: 'n-protocols', type: 'note', ref: 'notes/al-evaluation-protocols', short: 'Evaluation protocols', x: 405, y: 468, label: 'left' },

  // ── Explainable AI ───────────────────────────────────────
  { id: 'r-xai', type: 'research', ref: 'research/faithful-explanations', short: 'Faithful explanations', x: 248, y: 222, label: 'bottom' },
  {
    id: 'q-faithful', type: 'question', code: 'Q-002', title: 'Faithful, or merely plausible?', short: 'Faithfulness',
    topic: 'xai', x: 150, y: 120, label: 'right', status: 'open',
    url: '/research/faithful-explanations/#question',
    summary: 'Does an explanation reflect what the model computes, or only what a reader expects?',
  },
  {
    id: 'm-attribution', type: 'method', code: 'M-03', title: 'Feature attribution', short: 'Attribution',
    topic: 'xai', x: 330, y: 110, label: 'right', status: 'method',
    url: '/research/faithful-explanations/#approach',
    summary: 'Gradient-based and Shapley-value methods that assign credit to input features.',
  },

  // ── Mathematical foundations ─────────────────────────────
  { id: 'r-opt', type: 'research', ref: 'research/first-order-convergence', short: 'First-order methods', x: 800, y: 178, label: 'bottom' },
  {
    id: 'q-rates', type: 'question', code: 'Q-003', title: 'What really drives a convergence rate?', short: 'Convergence rates',
    topic: 'math', x: 640, y: 110, label: 'left', status: 'open',
    url: '/research/first-order-convergence/#question',
    summary: 'Which assumptions — smoothness, convexity, strong convexity — are doing the work.',
  },
  {
    id: 'm-optimization', type: 'method', code: 'M-04', title: 'First-order optimization', short: 'Optimization',
    topic: 'math', x: 912, y: 132, label: 'bottom', status: 'method',
    url: '/research/first-order-convergence/#approach',
    summary: 'Gradient descent and its relatives, studied through their proofs.',
  },
  { id: 'n-descent', type: 'note', ref: 'notes/descent-lemma', short: 'Descent lemma', x: 880, y: 300, label: 'bottom' },

  // ── Learning & systems ───────────────────────────────────
  { id: 'n-mlzero', type: 'note', ref: 'notes/ml-from-zero-week1', short: 'ML from zero · 01', x: 780, y: 560, label: 'left' },
  {
    id: 't-site', type: 'tool', code: 'T-01', title: 'Observatory of Questions (site source)', short: 'This site',
    topic: 'systems', x: 905, y: 612, label: 'top', status: 'active',
    url: 'https://github.com/BoyongTang/BoyongTang.github.io',
    summary: 'The open-source code of this homepage: static pages, content collections, and the atlas.',
  },
];

export const edges: AtlasEdgeSpec[] = [
  { source: 'q-discovery', target: 'r-al', relation: 'motivates', description: 'The project exists to answer this question.' },
  { source: 'r-al', target: 'm-acquisition', relation: 'uses', description: 'Acquisition rules choose each next experiment.' },
  { source: 'r-al', target: 'm-uq', relation: 'uses', description: 'The surrogate’s uncertainty feeds the acquisition rule.' },
  { source: 'm-uq', target: 'm-acquisition', relation: 'related_to', description: 'Acquisition turns predictive uncertainty into a decision.' },
  { source: 'n-protocols', target: 'r-al', relation: 'documents', description: 'Reading log on how such comparisons should be evaluated.' },

  { source: 'q-faithful', target: 'r-xai', relation: 'motivates', description: 'The study starts from this question.' },
  { source: 'r-xai', target: 'm-attribution', relation: 'uses', description: 'Attribution methods are the object being tested.' },
  { source: 'r-xai', target: 'r-al', relation: 'related_to', description: 'Could attributions explain why an experiment was chosen?' },

  { source: 'q-rates', target: 'r-opt', relation: 'motivates', description: 'The study works through this question.' },
  { source: 'r-opt', target: 'm-optimization', relation: 'uses', description: 'Gradient methods are the subject of the proofs.' },
  { source: 'n-descent', target: 'r-opt', relation: 'documents', description: 'Proof notes for the basic convergence bound.' },
  { source: 'm-optimization', target: 'm-acquisition', relation: 'related_to', description: 'Acquisition functions are themselves maximised by an optimizer.' },

  { source: 'n-mlzero', target: 'n-descent', relation: 'extends', description: 'Week-one notes lead into the descent lemma.' },
  { source: 't-site', target: 'n-mlzero', relation: 'related_to', description: 'Notes are published through this site.' },
];
