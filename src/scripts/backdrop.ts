import { PILLARS } from '../data/pillars';
import { fitPillars } from '../lib/pillars-fit';
import { reducedMotion } from './motion';
import { LivingPillars, type Rect, type View } from './pillars-gl';

// The one sky behind every page: the living Pillars of Creation, fixed to the window.
//   explore  the home page and the parts' pages: the whole pillars, placed by src/scripts/explorer.ts;
//            the sky round them sits darker (PILLARS.dim) and the view moves gently with the mouse
//   page     a dimmed, softened stretch of the pillars behind a page of text
// Without WebGL 2 the page keeps a still copy of the image (html:not(.has-gl)).

type Mode = 'page' | 'explore';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

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

  const intro = mode === 'explore' && html.classList.contains('sky-intro') ? performance.now() : 0;

  let dirty = true;
  addEventListener('scroll', () => (dirty = true), { passive: true });
  addEventListener('resize', () => (dirty = true));

  const IMG = PILLARS.size;

  let edge = 0.02;

  /** The near layer's place on screen, before any camera move. */
  function baseRect(): Rect {
    const vw = innerWidth;
    const vh = innerHeight;
    const view = mode === 'explore' ? window.__oqView : undefined;
    if (view) {
      // fade in from the dark where the image's left edge shows
      edge = view.x > 4 ? 0.22 : 0.02;
      return { ...view };
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
    // the explorer fills one screen and never scrolls; a page of text dims the sky behind it
    let dim = mode === 'explore' ? 0 : dimBase;
    // on the home page the sky round the pillars sits darker than the photo (the pillars keep their light)
    const v: Partial<View> = { skyDim: mode === 'explore' ? PILLARS.dim : 0, blur: mode === 'page' ? 1.1 : 0, life: still ? 0 : mode === 'page' ? 0.7 : 1 };

    let near: [number, number] = [0, 0];
    if (!still) {
      // a slow drift and the pointer move the far layer against the near one
      ptr.x += (ptr.tx - ptr.x) * 0.04;
      ptr.y += (ptr.ty - ptr.y) * 0.04;
      par = [Math.sin(t * 0.05) * 14 + ptr.x * 26, Math.cos(t * 0.037) * 10 + ptr.y * 18];
      // and the near layer (the pillars, and the parts on them) a little the other way, so the whole
      // scene moves in depth with the mouse
      near = [-ptr.x * 12, -ptr.y * 8];
      if (mode === 'page') par[1] += Math.min(vh, scrollY) * 0.03;
    }

    if (intro) {
      const p = ease((now - intro) / 3000);
      rect = about(rect, vw * 0.65, vh * 0.45, 1 + 0.1 * (1 - p));
      dim = Math.max(dim, 1 - p);
    }
    rect.x += near[0];
    rect.y += near[1];
    if (mode === 'explore') {
      const ex = document.querySelector<HTMLElement>('[data-ex]');
      ex?.style.setProperty('--nx', `${near[0].toFixed(2)}px`);
      ex?.style.setProperty('--ny', `${near[1].toFixed(2)}px`);
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
  let lastView = '';
  const loop = () => {
    requestAnimationFrame(loop);
    // one clock for everything (frame timestamps can trail performance.now() a little)
    const now = performance.now();
    if (document.hidden) return;
    const animating = !still || (intro && now - intro < 3100);
    // the explorer moved the camera
    if (mode === 'explore' && window.__oqView) {
      const v = window.__oqView;
      const key = `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.w.toFixed(1)}`;
      if (key !== lastView) {
        lastView = key;
        dirty = true;
      }
    }
    if (!animating && !dirty) return;
    if (now - last < 1000 / fps - 2) return;
    last = now;
    dirty = false;
    frame(now);
  };

  LivingPillars.create(canvas, wide ? PILLARS.variants.wide.src : PILLARS.variants.tall.src, '/sky/pillars-maps.png').then((p) => {
    if (!p) {
      // no WebGL after all: show the still image instead
      html.classList.remove('has-gl');
      html.classList.add('sky-ready');
      return;
    }
    lp = p;
    // on a large, sharp screen the explorer asks for the full-size photo
    addEventListener(
      'pillars:sharpen',
      () => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => {
          lp?.replacePhoto(im);
          dirty = true;
        };
        im.src = '/sky/pillars-max.webp';
      },
      { once: true },
    );
    lp.setScale(mode === 'page' ? 0.6 : 1);
    frame(performance.now());
    el.classList.add('is-live');
    // the parts on the home page come out with the sky
    requestAnimationFrame(() => html.classList.add('sky-ready'));
    requestAnimationFrame(loop);
  });
}
