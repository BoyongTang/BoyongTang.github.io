// ─────────────────────────────────────────────────────────────────────────────────────────────────────
//  The stars of the four parts — the only file to edit to fill the sky.
//
//  Each part is a list of star chains. A chain is one field or theme (e.g. AI4S, XAI): its name is shown
//  on the map beside it, and its stars are joined in the order you list them. Different chains are drawn
//  apart, each as its own constellation.
//
//  A chain:
//    chain  its name on the map, e.g. 'AI4S'                          (optional: leave out for no name)
//    zh     a Chinese name beside it, e.g. '科学智能'                  (optional)
//    stars  the stars, in order: each is joined to the one before it
//
//  A star:
//    name   the label on the star (required)
//    zh     a Chinese name, shown beside it in the card               (optional)
//    kind   a small word under the label, e.g. 'Paper', '项目'        (optional)
//    note   a short line under the label, e.g. '2026 · ongoing'       (optional)
//    text   a paragraph in the card                                   (optional)
//    link   one link: a web address, or 'mailto:you@example.com'      (optional)
//    links  several links: [{ label: 'Paper', href: 'https://…' }, …] (optional)
//    bright true for a bigger, brighter star                          (optional)
//    from   start a branch: join this star to an earlier star of the same chain, by its name, instead of
//           to the one just before it (the stars after it carry on from it)                  (optional)
//
//  A `from` name that matches no earlier star in the chain stops the build and says which one.
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
  from?: string;
}

export interface ChainInput {
  chain?: string;
  zh?: string;
  stars: StarInput[];
}

export const stars: Record<FacetId, ChainInput[]> = {
  // 研究 Research — on the tallest pillar's head
  research: [
    // {
    //   chain: 'AI4S',
    //   zh: '科学智能',
    //   stars: [
    //     { name: 'Active learning', text: 'What it is and why it matters to me.', bright: true },
    //     { name: 'Bayesian optimization' },
    //     { name: 'A paper title', kind: 'Paper', note: '2026 · preprint', link: 'https://arxiv.org/abs/…' },
    //     { name: 'Surrogate models', from: 'Active learning' }, // a branch off the first star
    //   ],
    // },
    // {
    //   chain: 'XAI',
    //   zh: '可解释 AI',
    //   stars: [
    //     { name: 'Feature attribution', bright: true },
    //     { name: 'Trustworthy evaluation' },
    //   ],
    // },
  ],

  // 个人介绍 Intro — on the middle pillar's red tip
  intro: [
    // {
    //   stars: [
    //     { name: 'Sichuan University', kind: 'Education', note: '2024 –' },
    //     { name: 'Chengdu' },
    //   ],
    // },
  ],

  // 作品 Works — on the tip of the small pillar
  works: [
    // {
    //   chain: 'AI4S',
    //   stars: [
    //     { name: 'A project', kind: 'Project', text: 'What it does.', link: 'https://github.com/…' },
    //   ],
    // },
    // {
    //   chain: 'XAI',
    //   stars: [{ name: 'Another project', kind: 'Project' }],
    // },
  ],

  // 联系 Contact — on the small gas globule
  contact: [
    // {
    //   stars: [
    //     { name: 'Email', link: 'mailto:boyong.tang.math.ai@gmail.com', bright: true },
    //     { name: 'GitHub', link: 'https://github.com/BoyongTang' },
    //   ],
    // },
  ],
};
