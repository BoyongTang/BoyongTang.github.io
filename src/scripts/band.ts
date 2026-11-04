import { bandAt, bandFor, bandNormal, bandWidth, spotAt } from '../lib/band';
import { seeded, starColor, starKind } from '../lib/stars';
import { reducedMotion } from './form';

// Paints the quiet star band once per size, after the Event Horizon sky: a soft glow along the band,
// thousands of faint white / icy blue / amber stars thickest at its centre, clumps of star clouds, a dark
// dust lane wandering through it, and a few bright stars in front.

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const COLORS = { w: rgb(starColor.w), b: rgb(starColor.b), a: rgb(starColor.a) };

function paint(cv: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const b = bandFor(w, h);
  const W = bandWidth(w, h);
  const rand = seeded(2027);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
  const at = (t: number, off: number) => {
    const [x, y] = bandAt(b, t, w, h);
    const [nx, ny] = bandNormal(b, t, w, h);
    return [x + nx * off, y + ny * off];
  };
  const blob = (x: number, y: number, r: number, c: number[], a: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
    g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // 1 · the glow: warm in the middle of the band, cooler towards its ends
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 110; i++) {
    const t = -0.05 + (i / 109) * 1.1;
    const warm = Math.exp(-(((t - 0.5) / 0.3) ** 2));
    const c = [130 + 125 * warm, 150 + 60 * warm, 205 - 45 * warm].map(Math.round);
    const [x, y] = at(t, gauss() * W * 0.18);
    blob(x, y, W * (0.75 + rand() * 0.6), c, 0.03 + 0.02 * warm);
  }
  // star clouds: brighter clumps along the band
  for (let i = 0; i < 22; i++) {
    const [x, y] = at(rand(), gauss() * W * 0.35);
    blob(x, y, W * (0.12 + rand() * 0.3), [235, 225, 215], 0.045 + rand() * 0.04);
  }

  // 2 · the stars: most crowd the band's centre, some spread wide, a few anywhere on the sky
  const n = Math.min(11000, Math.round((w * h) / 150));
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let near: number;
    const r0 = rand();
    if (r0 < 0.14) {
      x = rand() * w;
      y = rand() * h;
      near = 0;
    } else {
      const s = r0 < 0.7 ? 0.36 : 0.9;
      const off = gauss() * W * s;
      [x, y] = at(-0.04 + rand() * 1.08, off);
      near = Math.exp(-((off / W) ** 2) * 2.2);
    }
    const big = rand() ** 6;
    const r = 0.3 + big * 1.15 + near * 0.25;
    const a = Math.min(1, (0.16 + rand() * 0.4 + near * 0.28) * (0.55 + big));
    const c = COLORS[starKind(rand())];
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
    if (r < 0.7) ctx.fillRect(x - r, y - r, r * 2, r * 2);
    else {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3 · the dust lane: dark, mottled, wandering a little off the centre line
  ctx.globalCompositeOperation = 'source-over';
  const ph = rand() * 6;
  for (let i = 0; i < 260; i++) {
    const t = rand() * 1.1 - 0.05;
    const wander = Math.sin(t * 7 + ph) * 0.16 + Math.sin(t * 17 + ph * 2) * 0.06;
    const [x, y] = at(t, (wander + gauss() * 0.07) * W);
    const r = W * (0.04 + rand() ** 2 * 0.2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.1 + rand() * 0.16;
    g.addColorStop(0, `rgba(3,5,9,${a})`);
    g.addColorStop(1, 'rgba(3,5,9,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // 4 · a few bright stars in front, each a soft point
  ctx.globalCompositeOperation = 'lighter';
  const bright = Math.round((w * h) / 26000);
  for (let i = 0; i < bright; i++) {
    const onBand = rand() < 0.7;
    const [x, y] = onBand ? at(rand(), gauss() * W * 0.6) : [rand() * w, rand() * h];
    const c = COLORS[starKind(rand())];
    const r = 2.5 + rand() ** 2 * 5;
    blob(x, y, r, c, 0.35 + rand() * 0.35);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
  }
  ctx.globalCompositeOperation = 'source-over';
}

/** Stars that breathe: a handful of glints placed along the band (CSS does the breathing). */
function glints(layer: HTMLElement, w: number, h: number) {
  const b = bandFor(w, h);
  const W = bandWidth(w, h);
  const rand = seeded(311);
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 34; i++) {
    const t = rand();
    const [x, y] = bandAt(b, t, w, h);
    const [nx, ny] = bandNormal(b, t, w, h);
    const off = (rand() - 0.5) * 2 * W * 0.8;
    const g = document.createElement('i');
    g.style.left = `${(((x + nx * off) / w) * 100).toFixed(2)}%`;
    g.style.top = `${(((y + ny * off) / h) * 100).toFixed(2)}%`;
    g.style.setProperty('--g', starColor[starKind(rand())]);
    g.style.setProperty('--gd', `${(5 + rand() * 7).toFixed(1)}s`);
    g.style.setProperty('--gl', `${(-rand() * 10).toFixed(1)}s`);
    frag.append(g);
  }
  layer.replaceChildren(frag);
}

export function initBand(root: HTMLElement) {
  const html = document.documentElement;
  const band = root.querySelector<HTMLElement>('.sky__band')!;
  const cv = root.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const glintLayer = root.querySelector<HTMLElement>('[data-glints]')!;
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const nebulae = [...root.querySelectorAll<HTMLAnchorElement>('[data-nebula]')];

  let size = '';
  const layout = () => {
    const w = root.clientWidth;
    const h = root.clientHeight;
    if (!w || !h || `${w}x${h}` === size) return;
    size = `${w}x${h}`;
    paint(cv, w, h);
    band.classList.add('is-painted');
    glints(glintLayer, w, h);
    // put each nebula exactly on the band for this screen
    const b = bandFor(w, h);
    for (const a of nebulae) {
      const [x, y] = spotAt(b, Number(a.dataset.t), Number(a.dataset.side), w, h);
      a.style.left = `${x}px`;
      a.style.top = `${y}px`;
      a.classList.toggle('nebula--flip', x > w * 0.8);
    }
  };
  layout();
  let timer = 0;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = window.setTimeout(layout, 150);
  }).observe(root);

  // the opening
  if (html.classList.contains('band-intro')) {
    html.dataset.band = 'run';
    try {
      sessionStorage.setItem('oq.band', '1');
    } catch {
      /* private mode: the opening may play again */
    }
    if (/[?&]intro\b/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
    const end = () => {
      html.classList.remove('band-intro');
      html.dataset.band = 'done';
    };
    const t = window.setTimeout(end, 4200);
    const skip = () => {
      clearTimeout(t);
      end();
    };
    addEventListener('pointerdown', skip, { once: true });
    addEventListener('wheel', skip, { once: true, passive: true });
    addEventListener('keydown', skip, { once: true });
    addEventListener('oq:motion', () => reducedMotion() && skip());
  }

  // entering a nebula: fall into it, then open its star map
  for (const a of nebulae) {
    a.addEventListener('click', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || reducedMotion()) return;
      ev.preventDefault();
      const box = a.getBoundingClientRect();
      const rb = root.getBoundingClientRect();
      stage.style.setProperty('--ox', `${box.left + box.width / 2 - rb.left}px`);
      stage.style.setProperty('--oy', `${box.top + box.height / 2 - rb.top}px`);
      root.classList.add('is-diving');
      try {
        sessionStorage.setItem('oq.dive', a.dataset.nebula ?? '');
      } catch {
        /* the map simply arrives without knowing */
      }
      window.setTimeout(() => (location.href = a.href), 640);
    });
  }
  // back from a star map (/#n-research): stay on the whole sky and put focus on the nebula we came from
  const from = location.hash.startsWith('#n-') ? root.querySelector<HTMLElement>(location.hash) : null;
  if (from) {
    scrollTo(0, 0);
    from.focus({ preventScroll: true });
  }

  // coming back with the browser's back button restores the page as it was left: undo the dive
  addEventListener('pageshow', (ev) => {
    if (ev.persisted) root.classList.remove('is-diving');
  });
}
