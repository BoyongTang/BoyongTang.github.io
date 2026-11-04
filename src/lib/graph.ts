import { getCollection } from 'astro:content';
import { edges, nodes, relationStyle, topics, type AtlasNodeSpec, type LabelSide, type NodeType, type Relation } from '../data/atlas';

export interface GraphNode {
  id: string;
  type: NodeType;
  code: string;
  title: string;
  short: string;
  topic: string;
  topicLabel: string;
  url: string;
  external: boolean;
  status: string;
  summary: string;
  sample: boolean;
  featured: boolean;
  x: number;
  y: number;
  label: LabelSide;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: Relation;
  relationLabel: string;
  dash: string;
  description: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const typeLabel: Record<NodeType, string> = {
  question: 'Question',
  method: 'Method',
  research: 'Research',
  note: 'Field note',
  tool: 'Instrument',
  paper: 'Publication',
};

/** Resolve the atlas against the content collections, and refuse to build if it does not add up. */
export async function loadGraph(): Promise<Graph> {
  const research = await getCollection('research');
  const notes = await getCollection('notes');
  const topicLabel = new Map(topics.map((t) => [t.id, t.label]));
  const problems: string[] = [];

  const resolve = (spec: AtlasNodeSpec): GraphNode | null => {
    let base: Partial<GraphNode> = {};
    if (spec.ref) {
      const [kind, slug] = spec.ref.split('/');
      if (kind === 'research') {
        const e = research.find((r) => r.id === slug);
        if (!e) return problems.push(`node ${spec.id}: no research entry "${slug}"`), null;
        base = {
          code: e.data.code, title: e.data.title, topic: e.data.topic, url: `/research/${e.id}/`,
          status: e.data.status, summary: e.data.summary, sample: e.data.sample,
        };
      } else if (kind === 'notes') {
        const e = notes.find((n) => n.id === slug);
        if (!e) return problems.push(`node ${spec.id}: no note "${slug}"`), null;
        base = {
          code: e.data.code, title: e.data.title, topic: e.data.topic, url: `/notes/${e.id}/`,
          status: 'published', summary: e.data.summary, sample: e.data.sample,
        };
      } else {
        return problems.push(`node ${spec.id}: unknown ref kind "${kind}"`), null;
      }
    }
    const merged = {
      code: spec.code ?? base.code ?? spec.id.toUpperCase(),
      title: spec.title ?? base.title ?? '',
      topic: spec.topic ?? base.topic ?? '',
      url: spec.url ?? base.url ?? '',
      status: spec.status ?? base.status ?? '',
      summary: spec.summary ?? base.summary ?? '',
    };
    if (!merged.title) problems.push(`node ${spec.id}: missing title`);
    if (!merged.url) problems.push(`node ${spec.id}: missing url`);
    if (!topicLabel.has(merged.topic)) problems.push(`node ${spec.id}: unknown topic "${merged.topic}"`);
    return {
      id: spec.id,
      type: spec.type,
      ...merged,
      short: spec.short ?? merged.title,
      topicLabel: topicLabel.get(merged.topic) ?? merged.topic,
      external: /^https?:\/\//.test(merged.url),
      sample: base.sample ?? false,
      featured: spec.featured ?? false,
      x: spec.x,
      y: spec.y,
      label: spec.label ?? 'right',
    };
  };

  const ids = new Set<string>();
  for (const n of nodes) {
    if (ids.has(n.id)) problems.push(`duplicate node id "${n.id}"`);
    ids.add(n.id);
  }
  const resolved = nodes.map(resolve).filter((n): n is GraphNode => n !== null);

  const linked = new Set<string>();
  const graphEdges: GraphEdge[] = edges.map((e) => {
    if (!ids.has(e.source)) problems.push(`edge ${e.source} → ${e.target}: unknown source`);
    if (!ids.has(e.target)) problems.push(`edge ${e.source} → ${e.target}: unknown target`);
    if (!relationStyle[e.relation]) problems.push(`edge ${e.source} → ${e.target}: unknown relation "${e.relation}"`);
    if (!e.description.trim()) problems.push(`edge ${e.source} → ${e.target}: needs a description`);
    linked.add(e.source).add(e.target);
    return { ...e, relationLabel: relationStyle[e.relation].label, dash: relationStyle[e.relation].dash };
  });

  for (const n of resolved) if (!linked.has(n.id)) console.warn(`[atlas] node "${n.id}" has no relations`);
  for (const r of research) {
    if (!resolved.some((n) => n.url === `/research/${r.id}/`)) console.warn(`[atlas] research "${r.id}" is not on the map`);
  }

  if (problems.length) throw new Error(`Atlas data is inconsistent:\n  · ${problems.join('\n  · ')}`);
  return { nodes: resolved, edges: graphEdges };
}

/** Neighbours of a node with the relation, in reading order. */
export function relationsOf(graph: Graph, id: string) {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  return graph.edges
    .filter((e) => e.source === id || e.target === id)
    .map((e) => {
      const outgoing = e.source === id;
      return { edge: e, outgoing, other: byId.get(outgoing ? e.target : e.source)! };
    });
}

/** Deterministic pseudo-random numbers (mulberry32), so the ambient sky is the same on every visit. */
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

export interface AmbientStar {
  x: number;
  y: number;
  r: number;
  o: number;
  twinkle: number;
}

/** Decorative stars: no data, not clickable. */
export function ambientStars(count: number, seed = 103, w = 1000, h = 700): AmbientStar[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => {
    const big = rand() > 0.93;
    return {
      x: +(rand() * w).toFixed(1),
      y: +(rand() * h).toFixed(1),
      r: +(big ? 1.1 + rand() * 0.7 : 0.35 + rand() * 0.6).toFixed(2),
      o: +(big ? 0.55 + rand() * 0.3 : 0.15 + rand() * 0.4).toFixed(2),
      twinkle: rand() > 0.86 ? Math.floor(rand() * 4) + 1 : 0,
    };
  });
}

export const statusLabel = (s: string) => s.replace(/_/g, ' ').toUpperCase();
