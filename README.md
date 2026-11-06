# Boyong Tang

My personal website: who I am, what I work on, and how to reach me.

**Live:** [boyongtang.github.io](https://boyongtang.github.io)

The home page is a single view of the Pillars of Creation, as seen by the James Webb Space Telescope. Four
places on the pillars are the four parts of me:

| Part | 中文 | What it holds |
| --- | --- | --- |
| Research | 研究 | what I study, as star chains by field (e.g. AI4S, XAI) |
| Intro | 个人介绍 | who I am: one profile card |
| Works | 作品 | what I have made |
| Contact | 联系 | how to reach me |

The whole site is that one screen, with nothing to scroll. Choosing a part flies in to it and unfolds its
stars (Intro opens the profile card instead); choosing a star opens its card; a click anywhere else, or
Escape, steps back. Each part also has its own address (`/sky/<part>/`), which opens on it; without
JavaScript that page lists the part's content.

## Editing the content

Everything personal lives in two files:

- **[`src/data/profile.ts`](src/data/profile.ts):** the Intro card: name, one-line role, school, place,
  emails, GitHub, and an optional bio and CV. Anything left empty does not show.
- **[`src/data/stars.ts`](src/data/stars.ts):** the stars of Research, Works and Contact. Each part is a
  list of chains, usually one per subfield, with one star per paper or project:

  ```ts
  research: [
    {
      chain: 'AI4S',
      zh: '科学智能',
      stars: [
        { name: 'Paper A', kind: 'Paper', note: '2025 · NeurIPS', bright: true, link: 'https://arxiv.org/abs/…' },
        { name: 'Paper B', kind: 'Paper', note: '2026 · preprint' },
        { name: 'Paper C', kind: 'Paper', from: 'Paper A' }, // builds on Paper A: a branch
      ],
    },
    { chain: 'XAI', stars: [{ name: 'Paper D', kind: 'Paper' }] },
  ],
  ```

  Stars in a chain are joined in the order listed; `from` joins a star to an earlier one instead. Each chain is
  drawn as its own constellation, with its name above it. The comments at the top of the file list every
  field.

Other places to edit:

- **The parts' names and colours:** [`src/data/facets.ts`](src/data/facets.ts).
- **Where each part sits on the picture, and how dark the sky is:** [`src/data/pillars.ts`](src/data/pillars.ts).

## Running it

```bash
npm install
npm run dev      # http://localhost:4321, updates as you save
npm test         # build, then check every internal link and #anchor (CI runs the same)
npm run og       # redraw the link-preview image, public/og.png
```

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## How it is built

- [Astro](https://astro.build), all static: every page is plain HTML at build time.
- The living sky behind every page is WebGL 2 ([`src/scripts/pillars-gl.ts`](src/scripts/pillars-gl.ts)).
  A depth mask separates the pillars from the sky, giving parallax with the mouse, drifting gas, twinkling
  stars, and a darker sky round full-colour pillars. Without WebGL a still copy of the picture stands in.
- The one screen: [`src/components/Explorer.astro`](src/components/Explorer.astro) (markup and styles) and
  [`src/scripts/explorer.ts`](src/scripts/explorer.ts) (the camera, flying in to a part, the cards).
  Which part is the profile card: `PROFILE_PART` in [`src/data/facets.ts`](src/data/facets.ts).
- Star layout, at build time: [`src/lib/sky.ts`](src/lib/sky.ts). Where the picture sits on a screen:
  [`src/lib/pillars-fit.ts`](src/lib/pillars-fit.ts). The sky's mouse parallax and dimming:
  [`src/scripts/backdrop.ts`](src/scripts/backdrop.ts).
- Motion respects the system's reduced-motion setting ([`src/scripts/motion.ts`](src/scripts/motion.ts)).

## The picture

*Pillars of Creation (NIRCam)*, by NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI).
Licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source:
[esawebb.org/images/weic2216b](https://esawebb.org/images/weic2216b/). The credit is shown on every page
that shows the picture.

To rebuild the web copies and masks in `public/sky/`, download the publication JPEG (2309 × 4000) from that
page to `assets-src/pillars-webb.jpg` (kept out of git), then run:

```bash
python3 scripts/make-pillars.py   # needs numpy and Pillow
```
