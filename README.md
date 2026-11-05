# The Observatory of Questions · B1 Deep Field

> **A sky chart of questions worth pursuing.**
> Live site: [https://boyongtang.github.io](https://boyongtang.github.io)

Personal academic homepage for **Boyong Tang (けるゔぃん・とう)**, built following the **B1 Deep-Space Observatory** design specification (`The Observatory of Questions`).

---

## Architecture & Principles

1. **Truth Before Visuals:** Only results that publicly exist are shown; everything else stays a draft. Publication records are strictly distinguished from work in progress.
2. **Static-First with Astro:** All content is pre-rendered at build time. Search engines and screen readers can access the full textual hierarchy with JavaScript disabled.
3. **The Pillars of Creation:** the home page is the Pillars of Creation, full screen, to explore like a map (`src/components/Explorer.astro`): drag, scroll or pinch. The five parts of me (Research, Toolbox, Path, Works, Contact; `src/data/facets.ts`) sit on places in it (`src/data/pillars.ts`); choosing one, or zooming in close, unfolds its stars on the pillar, a star opens its card, and a click anywhere else steps back. The pillars are alive behind every page (WebGL 2, `src/scripts/pillars-gl.ts`): a depth mask gives the near pillars and the far stars parallax, gas drifts and stars twinkle; without WebGL a still copy stands in. Each part also has its own page (`/sky/<part>/`). Every star is real content (`src/lib/sky.ts`); lines join only declared relations. Each map is also a plain list below it, which is what keyboard, screen-reader and no-JavaScript visitors get.
4. **Editorial Reading Surface:** Research dossiers and field notes feature a high-contrast reading surface (`--reading-paper`), full KaTeX mathematical typesetting, and structured sections (*Question → Motivation → Approach → Evidence → Limitations → Next*).

---

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build, then check every internal link and #anchor (CI runs the same)
npm test

# Regenerate public/og.png from the pillars data (Node ≥ 23.6)
npm run og

# Rebuild public/sky/ (copies and masks) from assets-src/pillars-of-creation.webp, with a 4x AI upscale
# (Real-ESRGAN realesr-general-x4v3.pth, 4.7 MB, from github.com/xinntao/Real-ESRGAN releases v0.2.5.0)
python3 scripts/make-pillars.py --weights path/to/realesr-general-x4v3.pth

# Preview production build locally
npm run preview
```

---

## Updating Content

- **Personal Profile & Links:** Edit [`src/data/profile.ts`](src/data/profile.ts).
- **Research Dossiers:** Add or edit Markdown files under [`src/content/research/`](src/content/research/).
- **Field Notes & Proofs:** Add or edit Markdown files under [`src/content/notes/`](src/content/notes/).
- **Fields:** edit [`src/data/galaxies.ts`](src/data/galaxies.ts). Research and notes name one through `topic`.
- **The five parts and their stars:** [`src/data/facets.ts`](src/data/facets.ts) (names, colours, constellation lines) and
  [`src/lib/sky.ts`](src/lib/sky.ts) (which content becomes which star). Where each part sits in the photo: [`src/data/pillars.ts`](src/data/pillars.ts).
- **Drafts:** `draft: true` in a Markdown file or a project entry keeps an entry in the repo but off the site.
- **Projects:** `projects` in [`src/data/profile.ts`](src/data/profile.ts). Leave `repo` empty until a repository is public.
- **CV:** put the PDF in `public/` and set `profile.cv`; until then every CV link goes to `/about/#cv`.

---

## Image Credit

The sky is a picture of the Pillars of Creation (`assets-src/pillars-of-creation.webp`), found on Pinterest; its
maker is not named there. The web copies in `public/sky/` are cut above its baked-in title and upscaled 4x with Real-ESRGAN, and the
depth and glow masks are derived from it (`scripts/make-pillars.py`). Once the maker is known, name them in
`PILLARS.credit` in `src/data/pillars.ts`: the credit is shown on every page that shows the picture.
