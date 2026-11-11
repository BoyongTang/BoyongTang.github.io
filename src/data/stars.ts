// ─────────────────────────────────────────────────────────────────────────────────────────────────────
//  The stars of Research, Works, Contact, Honors and News (Intro is the profile card: src/data/profile.ts).
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
//    note   a short line under the label, e.g. '2026 · ongoing'; in the card it shows as a badge (optional)
//    title  the full title, at the top of the card                    (optional)
//    authors  'Boyong Tang, Tao Wang, Lei Yang': your name (profile.ts) is shown in bold (optional)
//    image  a figure at the top of the card: { src: '/research/….svg', alt: 'what it shows' }; put
//           the file in public/research/                              (optional)
//    text   a paragraph in the card: for a paper, one or two sentences on what it solves and how well (optional)
//    link   one link: a web address, or 'mailto:you@example.com'      (optional)
//    links  several links: [{ label: 'Paper', href: 'https://…' }, …] (optional)
//    bright true for a bigger, brighter star                          (optional)
//    from   start a branch: join this star to an earlier star of the same chain, by its name, instead of
//           to the one just before it (the stars after it carry on from it)                  (optional)
//
//  A `from` name that matches no earlier star in the chain stops the build and says which one.
//  Save, and the dev server (npm run dev) shows the change at once; nothing else needs touching.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────
import type { FacetId, PROFILE_PART } from './facets';

export interface StarInput {
  name: string;
  zh?: string;
  kind?: string;
  note?: string;
  title?: string;
  authors?: string;
  image?: { src: string; alt: string };
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

/** The parts that have stars: all but Intro, which is the profile card. */
export type StarPart = Exclude<FacetId, typeof PROFILE_PART>;

export const stars: Record<StarPart, ChainInput[]> = {
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
          note: 'Under Review',
          title: 'KolTa: A Physics-Informed Active Learning Framework for Formulation Discovery with Limited Data',
          authors: 'Boyong Tang, Tao Wang, Lei Yang',
          image: {
            src: '/research/kolta-predictor.svg',
            alt: 'Fig. 2. Three-stage predictor of KolTa, illustrated with three components in two roles',
          },
          text: 'Finds the top 5% of formulations under a fixed experiment budget, pairing a physics-constrained predictor with a physics-residual-calibrated acquisition rule (PRC-UCB). Ranks first or second on all four tasks and wins 75 of 78 paired comparisons.',
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

  // 作品 Works — on the tip of the small pillar
  works: [
     //{
       //chain: 'AI4S',
       //stars: [
         // add link: 'https://github.com/…' once the code is public
         //{ name: 'KolTa', kind: 'Research Repo', note: 'Code coming soon', text: "The open code of KolTa's AL framework." },
       //],
     //},
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
         { name: 'General Email', link: 'mailto:tang.boyong@outlook.com', bright: true },
         //{ name: 'GitHub', link: 'https://github.com/BoyongTang' },
       ],
     },
  ],

  // 荣誉 Honors — on the summit of the low pillar at the bottom left
  // One chain per kind of honor; one star per award, oldest first. `note` is the year (shown as a badge).
  honors: [
    {
      chain: 'Competitions',
      zh: '竞赛',
      stars: [
        {
          name: 'CUMCM',
          kind: 'Third Prize',
          note: '2026',
          title: 'China Undergraduate Mathematical Contest in Modeling (CUMCM)',
          bright: true,
        },
      ],
    },
    {
      chain: 'Sichuan University',
      zh: '四川大学',
      stars: [
        { name: 'Scholarship', kind: 'Third-Class', note: '2026', title: 'Third-Class Comprehensive Scholarship, Sichuan University' },
        { name: 'Merit Student', kind: 'Outstanding Student', note: '2026', title: 'Outstanding Student Honor (Merit Student), Sichuan University' },
      ],
    },
  ],

  // 动态 News — on the tallest pillar's arm, reaching out to the left
  // One star per piece of news, oldest first, so the line reads as a timeline. `note` is the date.
  news: [
    {
      stars: [
        {
          name: 'B.S. at SCU',
          kind: 'Education',
          note: 'Sept 2025',
          text: 'Began the B.S. in Applied Mathematics & Artificial Intelligence at Sichuan University.',
        },
        {
          name: 'Undergraduate Researcher',
          kind: 'Research',
          note: 'Aug 2026',
          text: 'Joined Prof. Tao Wang at Sichuan University as an undergraduate researcher.',
        },
        {
          name: 'KolTa preprint',
          kind: 'Preprint',
          note: 'Nov 2026',
          text: 'Posted KolTa, a physics-informed active learning framework for formulation discovery, to arXiv. Under review.',
          links: [{ label: 'arXiv', href: 'https://arxiv.org/abs/2611.06394' }],
          bright: true,
        },
      ],
    },
  ],
};
