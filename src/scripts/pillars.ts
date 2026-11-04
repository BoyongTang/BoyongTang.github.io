import { fitPillars } from '../lib/pillars-fit';
import { reducedMotion } from './form';

// Keeps the five parts pinned to their places in the photo on any screen, lets a few of the photo's
// brightest stars twinkle, runs the opening, and falls into a part when one is chosen.

export function initPillars(root: HTMLElement) {
  const html = document.documentElement;
  const img = root.querySelector<HTMLImageElement>('[data-photo]')!;
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const glintLayer = root.querySelector<HTMLElement>('[data-glints]')!;
  const parts = [...root.querySelectorAll<HTMLAnchorElement>('[data-part]')];
  const points: [number, number][] = JSON.parse(glintLayer.dataset.points ?? '[]');

  // the glints: built once, placed on every layout
  const glints = points.map((_, i) => {
    const g = document.createElement('i');
    g.style.setProperty('--gd', `${(6 + ((i * 7) % 9)).toFixed(1)}s`);
    g.style.setProperty('--gl', `${(-((i * 3.7) % 11)).toFixed(1)}s`);
    return g;
  });
  glintLayer.replaceChildren(...glints);

  let size = '';
  const layout = () => {
    const w = root.clientWidth;
    const h = root.clientHeight;
    // the still photo: whichever copy the browser picked (it follows the window's shape, not this
    // section's); the living sky behind the page goes by this section's shape, as the fit does
    const shape = img.currentSrc ? (/pillars-wide/.test(img.currentSrc) ? 'wide' : 'tall') : w / Math.max(1, h) >= 0.9 ? 'wide' : 'tall';
    const key = `${w}x${h}:${shape}`;
    if (!w || !h || key === size) return;
    size = key;
    const fit = fitPillars(w, h, shape);
    Object.assign(img.style, { left: `${fit.ox}px`, top: `${fit.oy}px`, width: `${fit.iw}px`, height: `${fit.ih}px` });
    img.classList.add('is-fitted');
    img.classList.toggle('is-framed', fit.framed);
    for (const a of parts) {
      const [sx, sy] = (a.dataset.spot ?? '0 0').split(' ').map(Number);
      const [x, y] = fit.at(sx, sy);
      a.style.left = `${x}px`;
      a.style.top = `${y}px`;
      // labels run away from the nearer edge
      const flip = x > w * (shape === 'wide' ? 0.78 : 0.5);
      a.classList.toggle('part--flip-wide', flip);
      a.classList.toggle('part--flip-tall', flip);
    }
    points.forEach(([px, py], i) => {
      const [x, y] = fit.at(px, py);
      glints[i].style.left = `${x}px`;
      glints[i].style.top = `${y}px`;
      glints[i].hidden = x < 0 || y < 0 || x > w || y > h;
    });
  };
  layout();
  img.addEventListener('load', () => {
    size = '';
    layout();
  });
  let timer = 0;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = window.setTimeout(layout, 120);
  }).observe(root);

  // the opening
  if (html.classList.contains('sky-intro')) {
    html.dataset.sky = 'run';
    try {
      sessionStorage.setItem('oq.pillars', '1');
    } catch {
      /* private mode: the opening may play again */
    }
    if (/[?&]intro\b/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
    const end = () => {
      html.classList.remove('sky-intro');
      html.dataset.sky = 'done';
    };
    const t = window.setTimeout(end, 4600);
    const skip = () => {
      clearTimeout(t);
      end();
    };
    addEventListener('pointerdown', skip, { once: true });
    addEventListener('wheel', skip, { once: true, passive: true });
    addEventListener('keydown', skip, { once: true });
    addEventListener('oq:motion', () => reducedMotion() && skip());
  }

  // choosing a part: fall into its place in the pillars, then open its star map
  for (const a of parts) {
    a.addEventListener('click', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || reducedMotion()) return;
      ev.preventDefault();
      const box = a.getBoundingClientRect();
      const rb = root.getBoundingClientRect();
      stage.style.setProperty('--ox', `${box.left + box.width / 2 - rb.left}px`);
      stage.style.setProperty('--oy', `${box.top + box.height / 2 - rb.top}px`);
      root.classList.add('is-diving');
      dispatchEvent(new CustomEvent('pillars:dive', { detail: { x: box.left + box.width / 2, y: box.top + box.height / 2 } }));
      try {
        sessionStorage.setItem('oq.dive', a.dataset.part ?? '1');
      } catch {
        /* the map simply arrives without the fly-in */
      }
      window.setTimeout(() => (location.href = a.href), 680);
    });
  }

  // back from a star map (/#n-research): stay on the whole sky, with focus on the part we came from
  const from = location.hash.startsWith('#n-') ? root.querySelector<HTMLElement>(location.hash) : null;
  if (from) {
    scrollTo(0, 0);
    from.focus({ preventScroll: true });
  }

  // the browser's back button restores the page as it was left: undo the dive
  addEventListener('pageshow', (ev) => {
    if (ev.persisted) root.classList.remove('is-diving');
  });
}
