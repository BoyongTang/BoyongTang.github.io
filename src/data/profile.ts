// Everything about the person lives here. The rest of the site reads from this file,
// from src/content/ (research dossiers and notes) and from src/data/galaxies.ts (the research universe).
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
    'I study applied mathematics and AI at Sichuan University. My current work is active learning for materials science: reproducing published methods on public papers, data and author code, then turning them into a closed loop that can move to new material systems.',
  /** 中文一句话简介（可留空）。 */
  bioZh: '四川大学本科生，用应用数学与机器学习研究材料科学中的主动学习。',

  interests: [
    'Active learning',
    'Bayesian optimization',
    'Surrogate models & uncertainty',
    'Trustworthy evaluation',
    'Machine learning for materials',
  ],
  /** Tools actually used day to day. */
  stack: ['Python', 'Jupyter', 'scikit-learn', 'RDKit', 'DeepChem', 'C++'],

  email: 'boyong.tang.math.ai@gmail.com',
  github: 'https://github.com/BoyongTang',
  /** Path to a PDF in /public, e.g. '/cv/Boyong_Tang_CV.pdf'. Empty: CV links point to /about/#cv instead. */
  cv: '',
  /** Other profiles. Empty href hides the link. */
  links: [
    { label: 'GitHub', href: 'https://github.com/BoyongTang' },
    { label: 'Google Scholar', href: '' },
    { label: 'ORCID', href: '' },
  ],

  /** About page. Keep it true; add rows (with real dates) as they happen. */
  education: [
    {
      when: 'In progress',
      what: 'Undergraduate · Applied Mathematics & Artificial Intelligence',
      where: 'Sichuan University, Chengdu',
      note: '',
    },
  ],
};

/** Where every "CV" link goes: the PDF when there is one, otherwise the CV section of About. */
export const cvHref = profile.cv || '/about/#cv';

/** Publications, newest first. Leave empty until a real record exists: the page says so honestly. */
export interface Publication {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  status: 'Working draft' | 'Preprint' | 'Accepted' | 'Published';
  links?: { label: string; href: string }[];
  /** Research dossier this paper came out of, e.g. 'active-learning-materials'. */
  research?: string;
  /** Galaxy id from src/data/galaxies.ts. */
  galaxy?: string;
}

export const publications: Publication[] = [];

/** Code and teaching work. `repo` stays empty until the repository is public: no dead links. */
export interface Project {
  id: string;
  code: string;
  name: string;
  nameZh?: string;
  summary: string;
  scope: string[];
  tech: string[];
  status: 'Ongoing' | 'Active' | 'Paused' | 'Archived';
  repo: string;
  /** Research dossier the project belongs to. */
  research?: string;
  /** Galaxy id from src/data/galaxies.ts. */
  galaxy?: string;
  /** Hidden from the site until it publicly exists (e.g. the repository is public). */
  draft?: boolean;
}

export const projects: Project[] = [
  {
    id: 't-01',
    code: 'T-01',
    name: 'Reproduction of Active Learning in Materials Science',
    nameZh: '材料科学主动学习复现',
    summary:
      'Reading, selecting and reproducing active-learning work in materials science, with active learning and Bayesian optimization kept strictly apart. Each paper or project gets an executable reproduction path.',
    scope: ['Executable reproduction path per paper', 'One loop and one evaluation protocol', 'Machine-readable manifest of path status and run evidence'],
    tech: ['Python', 'Active learning', 'Bayesian optimization'],
    status: 'Ongoing',
    repo: '',
    galaxy: 'materials',
    draft: true,
  },
  {
    id: 't-02',
    code: 'T-02',
    name: 'ML from Zero',
    nameZh: '从零开始的中文机器学习课程',
    summary:
      'A systematic machine-learning course for Chinese-speaking learners. It asks for more than running code: algorithmic intuition, worked derivations, data boundaries, reproducible evaluation and honest interpretation.',
    scope: ['Day 1–28 core + Day 29–35 GNN elective', 'Units 1–9 on active learning', 'Leakage-free comparison · multiple seeds · model cards'],
    tech: ['Python', 'Jupyter', 'scikit-learn', 'RDKit', 'DeepChem'],
    status: 'Ongoing',
    repo: '',
    galaxy: 'teaching',
    draft: true,
  },
  {
    id: 't-03',
    code: 'T-03',
    name: 'Observatory of Questions',
    summary: 'The source of this site: static pages from content collections, and a research atlas that also works as a plain list.',
    scope: ['Static-first Astro build', 'Declared relations, checked at build time', 'Keyboard, list and reduced-motion fallbacks'],
    tech: ['Astro', 'TypeScript', 'SVG', 'KaTeX'],
    status: 'Active',
    repo: 'https://github.com/BoyongTang/BoyongTang.github.io',
  },
];
