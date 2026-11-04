# The Observatory of Questions · B1 Deep Field

> **A sky chart of questions worth pursuing.**
> Live site: [https://boyongtang.github.io](https://boyongtang.github.io)

Personal academic homepage for **Boyong Tang (けるゔぃん・とう)**, built following the **B1 Deep-Space Observatory** design specification (`The Observatory of Questions`).

---

## Architecture & Principles

1. **Truth Before Visuals:** Only results that publicly exist are shown; everything else stays a draft. Publication records are strictly distinguished from work in progress.
2. **Static-First with Astro:** All content is pre-rendered at build time. Search engines and screen readers can access the full textual hierarchy with JavaScript disabled.
3. **Research Universe:** one SVG galaxy per field, unnamed on the map. Entering a galaxy opens a detailed chart where each real result is a labelled star (no connecting lines). Map / List views; every galaxy also has its own page.
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

# Regenerate public/og.png from the atlas data (Node ≥ 23.6)
npm run og

# Preview production build locally
npm run preview
```

---

## Updating Content

- **Personal Profile & Links:** Edit [`src/data/profile.ts`](src/data/profile.ts).
- **Research Dossiers:** Add or edit Markdown files under [`src/content/research/`](src/content/research/).
- **Field Notes & Proofs:** Add or edit Markdown files under [`src/content/notes/`](src/content/notes/).
- **Galaxies (fields):** edit [`src/data/galaxies.ts`](src/data/galaxies.ts) — one galaxy per field, unnamed on the map.
  A result joins a galaxy through its `topic` (research, notes) or `galaxy` (projects, publications) field.
- **Drafts:** `draft: true` in a Markdown file or a project entry keeps an entry in the repo but off the site.
- **Projects:** `projects` in [`src/data/profile.ts`](src/data/profile.ts). Leave `repo` empty until a repository is public.
- **CV:** put the PDF in `public/` and set `profile.cv`; until then every CV link goes to `/about/#cv`.
