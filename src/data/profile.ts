// Who you are: the card that opens when Intro (个人介绍) is chosen on the pillars. The other three parts'
// stars are in src/data/stars.ts. Keep it short. Anything left empty ('') simply does not show.

export const profile = {
  // ── the basics ───────────────────────────────────────────────────────────
  name: 'Boyong Tang',
  /** One plain line about you: under your name in the card, and in search results and link previews. */
  role: 'Undergraduate · Applied Mathematics & AI',
  affiliation: 'Sichuan University',
  /** Your scholar email (学术邮箱): the card's "Scholar email" button. */
  email: 'boyong.tang.math.ai@gmail.com',
  /** For everything else (一般事务邮箱): the card's "General email" button. Empty: none. */
  generalEmail: 'tang.boyong@outlook.com',
  github: 'https://github.com/BoyongTang',
  /** The quiet line under your name on the home page, e.g. 'Observe the unanswered.' Empty: none. */
  tagline: '',

  // ── optional: fill in only what you want shown ───────────────────────────
  /** Shown beside the school at the top of the card. */
  location: '',
  /** A few sentences about you, in the card. */
  bio: 'Undergrad in Applied Math & AI @ Sichuan University. Researching AI for Science (AI4S), Explainable AI (XAI) & Applied Mathematics etc.',
  /** 中文简介（可留空）。 */
  bioZh: '',
  /** A PDF in /public, e.g. '/cv.pdf': the card's "CV" button. Empty: none. */
  cv: '',
  /** One more sentence for search engines and link previews (optional). */
  subline: '',
  /** Research interests: small tags under your name on the second screen (scroll down on the home page). */
  interests: ['AI for Science (AI4S)', 'Explainable AI (XAI)', 'Applied Mathematics'],
};
