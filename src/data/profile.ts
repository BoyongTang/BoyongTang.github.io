// Who you are: the only file for your own details (the four parts' stars are in src/data/stars.ts).
// Keep it short. Anything left empty ('' or []) simply does not show anywhere.

export const profile = {
  // ── the basics ───────────────────────────────────────────────────────────
  name: 'Boyong Tang',
  /** One plain line under your name. */
  role: 'Undergraduate · Applied Mathematics & AI',
  affiliation: 'Sichuan University',
  email: 'boyong.tang.math.ai@gmail.com',
  github: 'https://github.com/BoyongTang',
  /** The quiet line under your name on the home page. */
  tagline: 'Observe the unanswered.',

  // ── optional: fill in only what you want shown ───────────────────────────
  /** Other names, shown small beside the main one, e.g. ['Kelvin']. */
  altNames: [] as string[],
  /** e.g. 'Chengdu, China'. */
  location: '',
  /** A few sentences about you (About page, and on phones below the pillars). */
  bio: '',
  /** 中文简介（可留空）。 */
  bioZh: '',
  /** e.g. ['Active learning', 'Bayesian optimization']. */
  interests: [] as string[],
  /** Tools you use, e.g. ['Python', 'PyTorch']. */
  stack: [] as string[],
  /** e.g. [{ when: '2024 –', what: 'BSc, Applied Mathematics & AI', where: 'Sichuan University', note: '' }]. */
  education: [] as { when: string; what: string; where: string; note?: string }[],
  /** A PDF in /public, e.g. '/cv.pdf'. Empty: "CV" links go to the About page instead. */
  cv: '',
  /** Other profiles, e.g. { label: 'Google Scholar', href: 'https://…' }. */
  links: [] as { label: string; href: string }[],
  /** One sentence for search engines and link previews (optional). */
  subline: '',
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

export const projects: Project[] = [];
