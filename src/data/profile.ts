// Everything about the person lives here. The rest of the site reads from this file,
// from src/content/ (research dossiers and notes) and from src/data/atlas.ts (the star map).
//
// Rule of the observatory: only write what is true. Leave a field empty ('' or []) to hide it.

export const profile = {
  /** Display name, set large on the home page. */
  name: 'Boyong Tang',
  /** Secondary names, shown small beside the main one. */
  altNames: ['Kelvin', 'けるゔぃん・とう'],
  handle: 'BoyongTang',

  /** One line, plain and factual. */
  role: 'Undergraduate · Applied Mathematics & Artificial Intelligence',
  affiliation: 'Sichuan University',
  location: 'Chengdu, China',
  timezone: 'UTC+08:00',

  tagline: 'Observe the unanswered.',
  subline: 'Mapping questions, methods, and the evidence between them.',
  /** The short bio on the home page (2–3 sentences). */
  bio:
    'I study applied mathematics and machine learning, with an interest in how models can make better decisions under uncertainty — and how we can tell when to trust them.',
  /** 中文一句话简介（可留空）。 */
  bioZh: '应用数学与人工智能方向本科生，关注不确定性下的决策与可解释的机器学习。',

  interests: ['Active learning', 'Uncertainty quantification', 'Explainable AI', 'Optimization'],

  email: 'boyong.tang.math.ai@gmail.com',
  github: 'https://github.com/BoyongTang',
  /** Path to a PDF in /public, e.g. '/cv/Boyong_Tang_CV.pdf'. Empty hides every CV button. */
  cv: '',
  /** Other profiles. Empty href hides the link. */
  links: [
    { label: 'GitHub', href: 'https://github.com/BoyongTang' },
    { label: 'Google Scholar', href: '' },
    { label: 'ORCID', href: '' },
  ],

  /** About page. Keep it true; add rows as they happen. */
  education: [
    {
      when: '20XX – present',
      what: 'B.S. in Applied Mathematics (AI track)',
      where: 'Sichuan University, Chengdu',
      note: 'Sample row — replace with your real programme and dates.',
    },
  ],
};

/** Publications, newest first. Leave empty until a real record exists: the page says so honestly. */
export interface Publication {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  status: 'Working draft' | 'Preprint' | 'Accepted' | 'Published';
  links?: { label: string; href: string }[];
  /** Research dossier this paper came out of, e.g. 'active-learning-formulation'. */
  research?: string;
}

export const publications: Publication[] = [];
