// Research fields. Research dossiers and notes name one through their `topic` field; a dossier's page
// shows its field as a small galaxy (GalaxyArt), drawn from `seed` so it is the same on every visit.
//
// Position and size are a layout on a 1000 × 700 sky — not coordinates, not a ranking.

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
  { id: 'math', name: 'Mathematics', nameZh: '数学', blurb: '', x: 250, y: 225, r: 158, form: 'spiral', arms: 2, rotation: -24, tilt: 0.6, hue: 'cyan', seed: 11 },
  { id: 'ai', name: 'AI', nameZh: '人工智能', blurb: '', x: 650, y: 345, r: 190, form: 'spiral', arms: 3, rotation: 18, tilt: 0.76, hue: 'gold', seed: 23 },
  { id: 'teaching', name: 'Teaching', nameZh: '教学', blurb: '', x: 290, y: 545, r: 125, form: 'spiral', arms: 2, rotation: 150, tilt: 0.46, hue: 'green', seed: 59 },
]

export const galaxyById = new Map(galaxies.map((g) => [g.id, g]));
export const galaxyCode = (g: Galaxy) => `G-${String(galaxies.indexOf(g) + 1).padStart(2, '0')}`;
