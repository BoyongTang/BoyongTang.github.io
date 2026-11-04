import { PILLARS } from '../data/pillars';
import { fitPillars } from '../lib/pillars-fit';
import { reducedMotion } from './form';
import { LivingPillars, type Rect, type View } from './pillars-gl';

// The one sky behind every page: the living Pillars of Creation, fixed to the window.
//   home  the whole column; the near pillars scroll with the page (so the parts stay on their spots),
//         the far stars and haze lag behind
//   page  a dimmed, softened stretch of the pillars behind a page of text
//   map   a star map's place in the pillars; dragging and zooming the map steers it
// Without WebGL 2 the page keeps a still copy of the image (html:not(.has-gl)).

type Mode = 'home' | 'page' | 'map';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeIn = (t: number) => Math.pow(clamp01(t), 3);

export function initBackdrop(el: HTMLElement) {
  const html = document.documentElement;
  if (!html.classList.contains('has-gl')) return;
  const canvas = el.querySelector<HTMLCanvasElement>('[data-gl]')!;
  const mode = (el.dataset.mode ?? 'page') as Mode;
  const at = (el.dataset.at ?? '0.6 0.35').split(' ').map(Number) as [number, number];
  const zoom = Number(el.dataset.zoom ?? 1.4);
  const dimBase = Number(el.dataset.dim ?? 0.55);
  const wide = innerWidth / Math.max(1, innerHeight) >= 0.9 && innerWidth >= 700;

  let lp: LivingPillars | null = null;
  const start = performance.now();
  let still = reducedMotion();
  addEventListener('oq:motion', () => {
    still = reducedMotion();
    dirty = true;
  });

  // the pointer nudges the far layer a little
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener(
    'pointermove',
    (ev) => {
      if (ev.pointerType !== 'mouse') return;
      ptr.tx = ev.clientX / innerWidth - 0.5;
      ptr.ty = ev.clientY / innerHeight - 0.5;
    },
    { passive: true },
  );

  // a star map steers the sky behind it
  const cam = { x: 0, y: 0, z: 1, tx: 0, ty: 0, tz: 1 };
  addEventListener('pillars:camera', (ev) => {
    const d = (ev as CustomEvent<{ x: number; y: number; z: number }>).detail;
    cam.tx = d.x;
    cam.ty = d.y;
    cam.tz = d.z;
    dirty = true;
  });

  // leaving for a star map: fall into the chosen place
  let dive: { x: number; y: number; t0: number } | null = null;
  addEventListener('pillars:dive', (ev) => {
    const d = (ev as CustomEvent<{ x: number; y: number }>).detail;
    dive = { x: d.x, y: d.y, t0: performance.now() };
  });
  addEventListener('pageshow', (ev) => {
    if (ev.persisted) dive = null;
  });

  // arriving: from a dive (or the home opening), the sky settles in
  let arrive = 0;
  try {
    if (sessionStorage.getItem('oq.dive')) {
      arrive = performance.now();
      sessionStorage.removeItem('oq.dive');
    }
  } catch {
    /* no arrival */
  }
  const intro = mode === 'home' && html.classList.contains('sky-intro') ? performance.now() : 0;

  let dirty = true;
  addEventListener('scroll', () => (dirty = true), { passive: true });
  addEventListener('resize', () => (dirty = true));

  const hero = mode === 'home' ? document.querySelector<HTMLElement>('[data-sky]') : null;
  const IMG = PILLARS.size;

  let edge = 0.02;

  /** The near layer's place on screen, before any camera move. */
  function baseRect(): Rect {
    const vw = innerWidth;
    const vh = innerHeight;
    if (hero) {
      const b = hero.getBoundingClientRect();
      const fit = fitPillars(b.width, b.height);
      // standing at full height on the right, the photo fades in from the dark on its left
      edge = fit.framed ? 0.22 : 0.02;
      const [x0, y0] = fit.at(0, 0);
      const [x1, y1] = fit.at(1, 1);
      return { x: b.left + x0, y: b.top + y0, w: x1 - x0, h: y1 - y0 };
    }
    const s = Math.max(vw / IMG.w, vh / IMG.h) * zoom;
    const w = IMG.w * s;
    const h = IMG.h * s;
    const x = Math.min(0, Math.max(vw - w, vw * 0.5 - at[0] * w));
    const y = Math.min(0, Math.max(vh - h, vh * 0.5 - at[1] * h));
    return { x, y: y - (mode === 'page' ? scrollY * 0.08 : 0), w, h };
  }

  const about = (r: Rect, cx: number, cy: number, k: number): Rect => ({ x: cx + (r.x - cx) * k, y: cy + (r.y - cy) * k, w: r.w * k, h: r.h * k });

  function frame(now: number) {
    if (!lp) return;
    const t = (now - start) / 1000;
    const vw = innerWidth;
    const vh = innerHeight;
    let rect = baseRect();
    let par: [number, number] = [0, 0];
    let dim = mode === 'home' ? Math.min(0.5, (scrollY / vh) * 0.5) : mode === 'map' ? 0.28 : dimBase;
    const v: Partial<View> = { blur: mode === 'page' ? 1.1 : mode === 'map' ? 0.25 : 0, life: still ? 0 : mode === 'page' ? 0.7 : 1 };

    if (!still) {
      // a slow drift and the pointer move the far layer against the near one
      ptr.x += (ptr.tx - ptr.x) * 0.04;
      ptr.y += (ptr.ty - ptr.y) * 0.04;
      par = [Math.sin(t * 0.05) * 14 + ptr.x * 26, Math.cos(t * 0.037) * 10 + ptr.y * 18];
      if (mode === 'home') par[1] += Math.min(vh, scrollY) * 0.06;
      if (mode === 'page') par[1] += Math.min(vh, scrollY) * 0.03;
    }

    if (mode === 'map') {
      const k = still ? 1 : 0.12;
      cam.x += (cam.tx - cam.x) * k;
      cam.y += (cam.ty - cam.y) * k;
      cam.z += (cam.tz - cam.z) * k;
      rect = about(rect, vw / 2, vh / 2, cam.z);
      rect.x += cam.x;
      rect.y += cam.y;
      par[0] -= cam.x * 0.15;
      par[1] -= cam.y * 0.15;
    }

    if (intro) {
      const p = ease((now - intro) / 3000);
      rect = about(rect, vw * 0.65, vh * 0.45, 1 + 0.1 * (1 - p));
      dim = Math.max(dim, 1 - p);
    }
    if (arrive) {
      const p = ease((now - arrive) / 1500);
      rect = about(rect, vw / 2, vh / 2, 1 + 0.6 * (1 - p));
      dim = Math.max(dim, 0.85 * (1 - p));
    }
    if (dive) {
      const p = easeIn((now - dive.t0) / 700);
      rect = about(rect, dive.x, dive.y, 1 + 4 * p);
      dim = Math.max(dim, p * 0.9);
    }

    // big shifts tear the photo where near meets far: keep the parallax a gentle one
    const m = Math.hypot(par[0], par[1]);
    if (m > 36) par = [(par[0] * 36) / m, (par[1] * 36) / m];
    lp.set({ ...v, rect, par, dim, edge });
    lp.draw(still ? 0 : t);
  }

  // dim, soft pages need fewer pixels and frames
  const fps = mode === 'page' ? 30 : 45;
  let last = 0;
  const loop = () => {
    requestAnimationFrame(loop);
    // one clock for everything (frame timestamps can trail performance.now() a little)
    const now = performance.now();
    if (document.hidden) return;
    const animating = !still || dive || (intro && now - intro < 3100) || (arrive && now - arrive < 1600) || mode === 'map';
    if (!animating && !dirty) return;
    if (now - last < 1000 / fps - 2) return;
    last = now;
    dirty = false;
    frame(now);
  };

  LivingPillars.create(canvas, wide ? '/sky/pillars-full.webp' : PILLARS.variants.tall.src, '/sky/pillars-maps.png').then((p) => {
    if (!p) {
      // no WebGL after all: show the still image instead
      html.classList.remove('has-gl');
      return;
    }
    lp = p;
    lp.setScale(mode === 'page' ? 0.6 : mode === 'map' ? 0.85 : 1);
    frame(performance.now());
    el.classList.add('is-live');
    requestAnimationFrame(loop);
  });
}
