// The research universe: one galaxy per field. Galaxies carry no names on the map — the name appears only
// once a visitor enters a galaxy (and in the list view / screen-reader label).
//
// Stars are decoration, generated from `seed` so the sky is identical on every visit. Results (papers,
// projects, notes, research) belong to a galaxy through their `topic` / `galaxy` field, never to a star.
//
// Position and size are a conceptual layout on a 1000 × 700 sky — not coordinates, not a ranking.

export type GalaxyForm = 'spiral' | 'elliptical' | 'ring';
export type Hue = 'cyan' | 'gold' | 'green' | 'star';

export interface Galaxy {
  id: string;
  name: string;
  nameZh?: string;
  /** One optional line shown inside the galaxy. Leave '' until it is decided. */
  blurb: string;
  x: number;
  y: number;
  /** Radius in sky units. */
  r: number;
  form: GalaxyForm;
  /** Spiral arms (spiral only). */
  arms?: number;
  /** Rotation in degrees. */
  rotation: number;
  /** Vertical squash, 1 = face-on, 0.3 = nearly edge-on. */
  tilt: number;
  hue: Hue;
  seed: number;
}

export const VIEW = { w: 1000, h: 700 };

export const galaxies: Galaxy[] = [
  { id: 'math', name: 'Applied Mathematics', nameZh: '应用数学', blurb: '', x: 215, y: 200, r: 140, form: 'spiral', arms: 2, rotation: -24, tilt: 0.62, hue: 'cyan', seed: 11 },
  { id: 'ml', name: 'Machine Learning', nameZh: '机器学习', blurb: '', x: 520, y: 350, r: 178, form: 'spiral', arms: 3, rotation: 18, tilt: 0.78, hue: 'gold', seed: 23 },
  { id: 'materials', name: 'Materials Science', nameZh: '材料科学', blurb: '', x: 825, y: 170, r: 118, form: 'elliptical', rotation: 32, tilt: 0.55, hue: 'star', seed: 37 },
  { id: 'evaluation', name: 'Trustworthy Evaluation', nameZh: '可信评价', blurb: '', x: 235, y: 530, r: 112, form: 'ring', rotation: 12, tilt: 0.5, hue: 'green', seed: 41 },
  { id: 'teaching', name: 'Teaching', nameZh: '教学', blurb: '', x: 805, y: 540, r: 126, form: 'spiral', arms: 2, rotation: 140, tilt: 0.45, hue: 'cyan', seed: 59 },
];

export const galaxyById = new Map(galaxies.map((g) => [g.id, g]));
export const galaxyCode = (g: Galaxy) => `G-${String(galaxies.indexOf(g) + 1).padStart(2, '0')}`;
