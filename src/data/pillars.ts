// The sky behind the site: a picture of the Pillars of Creation (assets-src/pillars-of-creation.webp, found on
// Pinterest; its maker is not named there). The five parts of me sit on five places in it: the three
// pillar heads, a finger of dust between them and the bright star beside the tallest.
//
// Positions are fractions of the picture as the site uses it (the source without its baked-in title,
// 0–1 across, 0–1 down). Web copies and masks are made by scripts/make-pillars.py.
// No Astro imports here, so scripts can use it directly.
import type { FacetId } from './facets';

export const PILLARS = {
  title: 'Pillars of Creation',
  /** Shown wherever the picture is. Name the maker here once known. */
  credit: 'picture found on Pinterest, maker not named',
  url: '',
  /**
   * The coordinate frame for positions and layouts: the source (736 × 1030 once its title is cut off) at 2×.
   * The textures themselves are an AI 4× upscale of it, at 1300 / 1800 / 2600 px wide (scripts/make-pillars.py).
   */
  size: { w: 1472, h: 2060 },
  /** Web copies: which part of the picture each holds, as [x0, y0, x1, y1]. */
  variants: {
    wide: { src: '/sky/pillars-wide.webp', crop: [0, 0, 1, 1], width: 1800 },
    tall: { src: '/sky/pillars-tall.webp', crop: [0, 0, 1, 1], width: 1300 },
  },
  /** Filling the screen, keep this point of the picture near this point of it: the five parts in view. */
  focus: {
    wide: { at: [0.56, 0.42], to: [0.5, 0.46] },
    tall: { at: [0.56, 0.44], to: [0.5, 0.42] },
  },
} as const;

/** The credit line, as text. */
export const creditLine = `${PILLARS.title}: ${PILLARS.credit}`;

/** Where each part of me sits in the picture. */
export const spots: Record<FacetId, [number, number]> = {
  research: [0.4, 0.3194], // the tall left pillar's glowing head
  contact: [0.298, 0.4212], // the bright star beside it
  path: [0.632, 0.3987], // the middle pillar's head
  works: [0.82, 0.4984], // the right pillar's head
  toolbox: [0.47, 0.5305], // a finger of dust between the pillars
};

/** Which side each part's label runs on wide and on tall screens, so neighbours never collide. */
export const labelLeft: Record<FacetId, { wide: boolean; tall: boolean }> = {
  research: { wide: false, tall: false },
  contact: { wide: false, tall: false },
  path: { wide: false, tall: false },
  works: { wide: true, tall: true },
  toolbox: { wide: false, tall: true },
};
