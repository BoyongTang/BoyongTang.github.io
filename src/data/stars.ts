// ─────────────────────────────────────────────────────────────────────────────────────────────────────
//  The stars of the four parts — the only file to edit to fill the sky.
//
//  Each part is a list of star chains. A chain is one subfield or theme (e.g. AI4S, XAI): its name is
//  shown on the map beside it, and its stars are joined in the order you list them. Different chains are
//  drawn apart, each as its own constellation. In Research a star is usually one paper; in Works, one
//  project.
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
  // One chain per subfield; one star per paper, listed oldest first so the line reads as a timeline.
  // Keep `name` short (it is the label on the map); the full title can go in `text` or a link's label.
  research: [
    {
      chain: 'AI4S',
      zh: '科学智能',
      stars: [
        {
          name: 'KolTa',
          kind: 'Research Paper',
          note: 'Under Submission',
          text: 'A Physics-Informed Active Learning Framework for Formulation Discovery with Limited Data',
          links: [
            { label: 'arXiv', href: 'https://arxiv.org/abs/2611.06394' },
            // { label: 'Code', href: 'https://github.com/…' }, // add once the code is public
          ],
          bright: true, // the paper that matters most
        },
        //{ name: 'Paper B', kind: 'Paper', note: '2026 · preprint', link: 'https://arxiv.org/abs/…' },
        //{ name: 'Paper C', kind: 'Paper', note: '2026 · ICML', from: 'Paper A' }, // builds on Paper A: a branch
      ],
    },
    // {
    //   chain: 'XAI',
    //   zh: '可解释 AI',
    //   stars: [
    //     { name: 'Paper D', kind: 'Paper', note: '2025 · AAAI', link: 'https://arxiv.org/abs/…', bright: true },
    //     { name: 'Paper E', kind: 'Paper', note: '2026 · under review' },
    //   ],
    // },
  ],

  // 个人介绍 Intro — on the middle pillar's red tip
  intro: [
     {
      stars: [
         { name: 'Sichuan University', kind: 'Undergraduate', note: '2025 – now' },
         { name: 'Chengdu' },
       ],
     },
  ],

  // 作品 Works — on the tip of the small pillar
  works: [
     {
       chain: 'AI4S',
       stars: [
         // add link: 'https://github.com/…' once the code is public
         { name: 'KolTa', kind: 'Research Repo', note: 'Code coming soon', text: "The open code of KolTa's AL framework." },
       ],
     },
    // {
    //   chain: 'XAI',
    //   stars: [{ name: 'Another project', kind: 'Project' }],
    // },
  ],

  // 联系 Contact — on the small gas globule
  contact: [
     {
       stars: [
         { name: 'Scholar Email', link: 'mailto:boyong.tang.math.ai@gmail.com', bright: true },
         { name: 'GitHub', link: 'https://github.com/BoyongTang' },
       ],
     },
  ],
};
