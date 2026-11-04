// The sky behind the site: Webb's Pillars of Creation (NIRCam, full view), a real image, used under its
// licence with the credit shown wherever it appears. The five parts of me sit on five places in it where
// stars are being born: the pillar heads, their glowing tips and a small evaporating gas globule.
//
// Positions are fractions of the full image (0–1 across, 0–1 down). Web copies are made from the
// original by scripts/make-pillars.mjs (still copies) and scripts/make-pillars-maps.py (the living sky's
// texture and masks). No Astro imports here, so scripts can use it directly.
import type { FacetId } from './facets';

export const PILLARS = {
  title: 'Pillars of Creation (NIRCam)',
  credit: 'NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI)',
  license: 'CC BY 4.0',
  url: 'https://esawebb.org/images/weic2216b/',
  /** The original, weic2216b (publication JPEG). */
  size: { w: 2309, h: 4000 },
  /** Web copies: which part of the image each holds, as [x0, y0, x1, y1]. */
  variants: {
    wide: { src: '/sky/pillars-wide.webp', crop: [0, 0.09, 1, 0.62], width: 2000 },
    tall: { src: '/sky/pillars-tall.webp', crop: [0, 0, 1, 1], width: 1100 },
  },
  /**
   * Covering the screen, keep this point of the image near this point of it. (Wide screens wider than
   * about 1.2 : 1 instead show the whole wide copy at full height on the right.)
   */
  focus: {
    wide: { at: [0.6, 0.33], to: [0.6, 0.52] },
    tall: { at: [0.55, 0.42], to: [0.5, 0.42] },
  },
} as const;

/** Where each part of me sits in the image. */
export const spots: Record<FacetId, [number, number]> = {
  research: [0.805, 0.195], // the tallest pillar's head, reaching out
  contact: [0.615, 0.345], // a small evaporating gas globule
  path: [0.865, 0.336], // the middle pillar's red, glowing tip
  works: [0.855, 0.457], // the tip of the small pillar
  toolbox: [0.285, 0.467], // the head of the left pillar
};

/** The brightest stars in the image (found by scripts/make-pillars.mjs), which gently twinkle. */
export const glints: [number, number][] = [
  [0.4745, 0.1435], [0.6329, 0.158], [0.6, 0.2995], [0.671, 0.567], [0.6632, 0.312], [0.368, 0.4765],
  [0.1316, 0.5475], [0.1965, 0.186], [0.51, 0.6315], [0.3515, 0.25], [0.8104, 0.2715], [0.7567, 0.3505],
  [0.2294, 0.154], [0.7939, 0.1095], [0.0935, 0.1415], [0.0312, 0.241], [0.116, 0.263], [0.8944, 0.3345],
  [0.3879, 0.1685], [0.045, 0.6185], [0.3861, 0.6435], [0.1229, 0.463], [0.5403, 0.3515], [0.232, 0.5355],
  [0.9255, 0.24], [0.2268, 0.3175], [0.5065, 0.175], [0.4649, 0.2525], [0.3662, 0.397], [0.5602, 0.4065],
  [0.2675, 0.9005], [0.2069, 0.869], [0.9273, 0.937], [0.4078, 0.767],
];
