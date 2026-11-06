// The sky behind the site: Webb's Pillars of Creation (NIRCam, full view), in its original colours and at its
// original tilt, used under its licence with the credit shown wherever it appears. The four parts of me sit
// on four places in it: the tallest pillar's head, a small evaporating gas globule, the middle pillar's red
// tip and the tip of the small pillar.
//
// Positions are fractions of the image (0–1 across, 0–1 down). Web copies and masks are made by
// scripts/make-pillars-webb.py. No Astro imports here, so scripts can use it directly.
import type { FacetId } from './facets';

export const PILLARS = {
  title: 'Pillars of Creation (NIRCam)',
  /** Shown wherever the image is. */
  credit: 'NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI), CC BY 4.0',
  url: 'https://esawebb.org/images/weic2216b/',
  /** How much darker than the photo the home page sky is: 0 = as bright as the photo, 1 = black. */
  dim: 0.28,
  /** The coordinate frame for positions and layouts: weic2216b, the publication JPEG. */
  size: { w: 2309, h: 4000 },
  /** Web copies: which part of the image each holds, as [x0, y0, x1, y1]. */
  variants: {
    wide: { src: '/sky/pillars-wide.webp', crop: [0, 0, 1, 1], width: 1800 },
    tall: { src: '/sky/pillars-tall.webp', crop: [0, 0, 1, 1], width: 1300 },
  },
  /**
   * How the image sits on a screen: the stretch from y[0] to y[1] fills the height, and x is the point of the
   * image at the centre. Wide screens show the whole pillar group; where the image ends left or right, the sky
   * continues (src/scripts/pillars-gl.ts). Tall screens show the image's full height.
   */
  frame: {
    wide: { y: [0.12, 0.64], x: 0.57 },
    tall: { y: [0, 1], x: 0.64 },
  },
} as const;

/** The credit line, as text. */
export const creditLine = `${PILLARS.title}: ${PILLARS.credit}`;

/** Where each part of me sits in the image. */
export const spots: Record<FacetId, [number, number]> = {
  research: [0.805, 0.195], // the tallest pillar's head, reaching out
  contact: [0.615, 0.345], // a small evaporating gas globule
  intro: [0.865, 0.336], // the middle pillar's red, glowing tip
  works: [0.855, 0.457], // the tip of the small pillar
};

/** Which side each part's label runs on wide and on tall screens, so neighbours never collide. */
export const labelLeft: Record<FacetId, { wide: boolean; tall: boolean }> = {
  research: { wide: true, tall: true },
  contact: { wide: false, tall: true },
  intro: { wide: true, tall: true },
  works: { wide: true, tall: true },
};
