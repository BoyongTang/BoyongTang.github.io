// ─────────────────────────────────────────────────────────────────────────────────────────────────────
//  The stars of the four parts — the only file to edit to fill the sky.
//
//  Each part has `stars` (what you see when you open it) and `lines` (which stars are joined).
//
//  A star:
//    name   the label on the star (required)
//    zh     a Chinese name, shown beside it in the card               (optional)
//    kind   a small word above it in the card, e.g. 'Interest', '项目' (optional)
//    note   a short line under the label on the map, e.g. '2026 · ongoing'      (optional)
//    text   a paragraph in the card                                   (optional)
//    link   one link: a web address, or 'mailto:you@example.com'      (optional)
//    links  several links: [{ label: 'Paper', href: 'https://…' }, …] (optional)
//    bright true for a bigger, brighter star                          (optional)
//
//  Lines: write each chain of stars as one string, names joined by ' - ' (a dash with spaces round it).
//    'A - B'        joins A and B
//    'A - B - C'    joins A to B and B to C
//  Use the stars' names exactly as written above them (capitals do not matter). A name that does not
//  match any star stops the build and says which one, so a typo cannot slip through.
//
//  Save, and the dev server (npm run dev) shows the change at once; nothing else needs touching.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────
import type { FacetId } from './facets';

export interface StarInput {
  name: string;
  zh?: string;
  kind?: string;
  note?: string;
  text?: string;
  link?: string;
  links?: { label: string; href: string }[];
  bright?: boolean;
}

export interface PartInput {
  stars: StarInput[];
  lines: string[];
}

export const stars: Record<FacetId, PartInput> = {
  // 研究 Research — on the tallest pillar's head
  research: {
    stars: [
      // { name: 'Active learning', kind: 'Interest', text: 'What it is and why it matters to me.', bright: true },
      // { name: 'Bayesian optimization', kind: 'Interest' },
      // { name: 'A paper title', kind: 'Paper', note: '2026 · preprint', link: 'https://arxiv.org/abs/…' },
    ],
    lines: [
      // 'Active learning - Bayesian optimization - A paper title',
    ],
  },

  // 个人介绍 Intro — on the middle pillar's red tip
  intro: {
    stars: [
      // { name: 'Sichuan University', kind: 'Education', note: '2024 –', text: 'Applied mathematics & AI.' },
      // { name: 'Chengdu', kind: 'Place' },
    ],
    lines: [
      // 'Sichuan University - Chengdu',
    ],
  },

  // 作品 Works — on the tip of the small pillar
  works: {
    stars: [
      // { name: 'This website', kind: 'Project', text: 'Built with Astro.', link: 'https://github.com/BoyongTang/BoyongTang.github.io' },
    ],
    lines: [],
  },

  // 联系 Contact — on the small gas globule
  contact: {
    stars: [
      // { name: 'Email', link: 'mailto:boyong.tang.math.ai@gmail.com', bright: true },
      // { name: 'GitHub', link: 'https://github.com/BoyongTang' },
    ],
    lines: [
      // 'Email - GitHub',
    ],
  },
};
