import { WORLD } from '../data/facets';
import { play, primeBurst, reducedMotion } from './form';

// A nebula's star map: drag to look around, wheel / pinch / buttons / + − to zoom, arrows to pan,
// select a star for its card. Without this script the map is a still picture whose stars link to the list.

type Box = { x: number; y: number; w: number; h: number };

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const MIN_W = 320;
const MAX_W = WORLD.w * 1.6;

export function initStarMap(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('[data-svg]')!;
  const card = root.querySelector<HTMLElement>('[data-card]')!;
  const cardBody = root.querySelector<HTMLElement>('[data-card-body]')!;
  const stars = new Map<string, SVGAElement>();
  root.querySelectorAll<SVGAElement>('[data-item]').forEach((a) => stars.set(a.dataset.item!, a));
  const lines = [...root.querySelectorAll<SVGLineElement>('.smap__lines line')];
  const views = { wide: root.dataset.view!.split(' ').map(Number), tall: root.dataset.tallView!.split(' ').map(Number) };
  root.classList.add('is-live');

  /* ── two layouts: wide screens get the figure as drawn, tall ones a narrower figure running down ── */
  type Spot = { x: number; y: number; side: string };
  const spots = new Map<string, { wide: Spot; tall: Spot }>();
  const parse = (v = ''): Spot => {
    const [x, y, side] = v.split(' ');
    return { x: Number(x), y: Number(y), side };
  };
  stars.forEach((a, id) => spots.set(id, { wide: parse(a.dataset.wide), tall: parse(a.dataset.tall) }));
  let shape: 'wide' | 'tall' = 'wide';
  const shapeFor = () => (svg.clientWidth / Math.max(1, svg.clientHeight) < 0.9 ? 'tall' : 'wide');
  const arrange = (to: 'wide' | 'tall') => {
    shape = to;
    stars.forEach((a, id) => {
      const p = spots.get(id)![to];
      a.setAttribute('transform', `translate(${p.x} ${p.y})`);
      const left = p.side === 'left';
      const [name, sub] = a.querySelectorAll('text');
      for (const [t, em] of [[name, 1.3], [sub, 2.1]] as const) {
        t.setAttribute('text-anchor', left ? 'end' : 'start');
        t.setAttribute('dx', `${left ? -em : em}em`);
      }
    });
    for (const l of lines) {
      const a = spots.get(l.dataset.a!)![to];
      const b = spots.get(l.dataset.b!)![to];
      l.setAttribute('x1', String(a.x));
      l.setAttribute('y1', String(a.y));
      l.setAttribute('x2', String(b.x));
      l.setAttribute('y2', String(b.y));
    }
  };
  arrange(shapeFor());
  const home = () => views[shape];

  let vb: Box = { x: home()[0], y: home()[1], w: home()[2], h: home()[3] };
  let frame = 0;
  let selected: string | null = null;

  /** The viewBox that shows `b` and fills the element (the SVG letterboxes otherwise). */
  const fill = (b: Box): Box => {
    const a = svg.clientWidth / Math.max(1, svg.clientHeight);
    let { w, h } = b;
    if (w / h < a) w = h * a;
    else h = w / a;
    return { x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h };
  };

  const clamp = (b: Box): Box => {
    const a = b.w / b.h;
    const w = Math.min(MAX_W, Math.max(MIN_W, b.w));
    const h = w / a;
    const cx = Math.min(WORLD.w + 200, Math.max(-200, b.x + b.w / 2));
    const cy = Math.min(WORLD.h + 200, Math.max(-200, b.y + b.h / 2));
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  };

  const set = (b: Box) => {
    vb = clamp(b);
    svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
    svg.style.setProperty('--ls', (vb.w / Math.max(1, svg.clientWidth)).toFixed(3));
  };

  const go = (target: Box, ms = 600) => {
    cancelAnimationFrame(frame);
    const to = clamp(target);
    if (reducedMotion() || ms === 0) return set(to);
    const from = { ...vb };
    const t0 = performance.now();
    const step = (now: number) => {
      const k = ease(Math.min(1, (now - t0) / ms));
      set({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k });
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  };

  const homeBox = () => {
    const [x, y, w, h] = home();
    return fill({ x, y, w, h });
  };

  /** Screen point → world point. */
  const toWorld = (cx: number, cy: number) => {
    const r = svg.getBoundingClientRect();
    return { x: vb.x + ((cx - r.left) / r.width) * vb.w, y: vb.y + ((cy - r.top) / r.height) * vb.h };
  };

  /** Zoom by `k` (>1 closer) keeping the world point under (cx, cy) where it is. */
  const zoomAt = (k: number, cx: number, cy: number, ms = 0) => {
    const p = toWorld(cx, cy);
    const w = Math.min(MAX_W, Math.max(MIN_W, vb.w / k));
    const s = w / vb.w;
    const target = { x: p.x - (p.x - vb.x) * s, y: p.y - (p.y - vb.y) * s, w, h: vb.h * s };
    if (ms) go(target, ms);
    else {
      cancelAnimationFrame(frame);
      set(target);
    }
  };

  const centre = () => {
    const r = svg.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  const starAt = (id: string) => spots.get(id)?.[shape] ?? null;

  /** Bring a star into the comfortable middle of the view (and closer, if we are far out). */
  const reveal = (id: string, force = false) => {
    const p = starAt(id);
    if (!p) return;
    const inside = p.x > vb.x + vb.w * 0.15 && p.x < vb.x + vb.w * 0.85 && p.y > vb.y + vb.h * 0.15 && p.y < vb.y + vb.h * 0.85;
    if (inside && !force) return;
    const w = Math.min(vb.w, 1300);
    const h = w * (vb.h / vb.w);
    // with the card open on a wide screen, keep the star left of it
    const shift = !card.hidden && svg.clientWidth > 640 ? w * 0.24 : 0;
    const drop = !card.hidden && svg.clientWidth <= 640 ? h * 0.2 : 0;
    go({ x: p.x - w / 2 + shift, y: p.y - h / 2 + drop, w, h });
  };

  /* ── selection and the card ── */
  function select(id: string, { move = true } = {}) {
    const entry = document.querySelector<HTMLElement>(`[data-entry="${CSS.escape(id)}"]`);
    if (!entry || !stars.has(id)) return;
    selected = id;
    stars.forEach((a, sid) => a.classList.toggle('is-selected', sid === id));
    cardBody.replaceChildren(entry.cloneNode(true));
    card.hidden = false;
    history.replaceState(null, '', `#s-${id}`);
    if (move) reveal(id, true);
  }

  function close() {
    if (!selected) return;
    const last = stars.get(selected);
    selected = null;
    stars.forEach((a) => a.classList.remove('is-selected'));
    card.hidden = true;
    history.replaceState(null, '', location.pathname);
    last?.focus({ preventScroll: true });
  }

  root.querySelector('[data-close]')?.addEventListener('click', close);

  // links between stars inside the card move to that star
  card.addEventListener('click', (ev) => {
    const a = (ev.target as Element).closest<HTMLAnchorElement>('[data-goto]');
    if (!a) return;
    ev.preventDefault();
    select(a.dataset.goto!);
    stars.get(a.dataset.goto!)?.focus({ preventScroll: true });
  });

  /* ── dragging and pinching ── */
  const pts = new Map<number, { x: number; y: number }>();
  let moved = 0;
  let pinch = 0;

  svg.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0 && ev.pointerType === 'mouse') return;
    pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    cancelAnimationFrame(frame);
    if (pts.size === 1) moved = 0;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  svg.addEventListener('pointermove', (ev) => {
    const last = pts.get(ev.pointerId);
    if (!last) return;
    const now = { x: ev.clientX, y: ev.clientY };
    pts.set(ev.pointerId, now);
    if (pts.size === 1) {
      const r = svg.getBoundingClientRect();
      const dx = ((now.x - last.x) / r.width) * vb.w;
      const dy = ((now.y - last.y) / r.height) * vb.h;
      moved += Math.abs(now.x - last.x) + Math.abs(now.y - last.y);
      // capture only once it is a drag, so a plain tap still reaches the star under it
      if (moved > 4 && !svg.hasPointerCapture(ev.pointerId)) {
        svg.setPointerCapture(ev.pointerId);
        root.classList.add('is-dragging');
      }
      set({ ...vb, x: vb.x - dx, y: vb.y - dy });
    } else if (pts.size === 2) {
      if (!svg.hasPointerCapture(ev.pointerId)) svg.setPointerCapture(ev.pointerId);
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoomAt(d / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch = d;
      moved += 10;
    }
  });

  const up = (ev: PointerEvent) => {
    pts.delete(ev.pointerId);
    if (pts.size < 2) pinch = 0;
    if (!pts.size) root.classList.remove('is-dragging');
  };
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);

  svg.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      const d = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
      zoomAt(Math.exp(-d * 0.0016), ev.clientX, ev.clientY);
    },
    { passive: false },
  );

  svg.addEventListener('dblclick', (ev) => {
    if ((ev.target as Element).closest('[data-item]')) return;
    zoomAt(1.8, ev.clientX, ev.clientY, 380);
  });

  /* ── stars ── */
  stars.forEach((a, id) => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (ev.detail !== 0 && moved > 6) return; // that was a drag, not a click
      select(id);
    });
    a.addEventListener('focus', () => reveal(id));
  });

  // a click on empty sky closes the card
  root.querySelector('[data-bg]')?.addEventListener('click', () => moved <= 6 && close());

  /* ── buttons and keys ── */
  root.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      const [cx, cy] = centre();
      if (b.dataset.zoom === 'in') zoomAt(1.6, cx, cy, 320);
      else if (b.dataset.zoom === 'out') zoomAt(1 / 1.6, cx, cy, 320);
      else go(homeBox(), 600);
    }),
  );

  document.addEventListener('keydown', (ev) => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable]')) return;
    // keys act on the map while it fills the screen
    const r = root.getBoundingClientRect();
    if (r.bottom < innerHeight * 0.5) return;
    const [cx, cy] = centre();
    const pan = (dx: number, dy: number) => go({ ...vb, x: vb.x + dx * vb.w * 0.18, y: vb.y + dy * vb.h * 0.18 }, 220);
    switch (ev.key) {
      case 'ArrowLeft': pan(-1, 0); break;
      case 'ArrowRight': pan(1, 0); break;
      case 'ArrowUp': pan(0, -1); break;
      case 'ArrowDown': pan(0, 1); break;
      case '+': case '=': zoomAt(1.4, cx, cy, 240); break;
      case '-': case '_': zoomAt(1 / 1.4, cx, cy, 240); break;
      case '0': go(homeBox()); break;
      case 'Escape': if (selected) close(); return;
      default: return;
    }
    ev.preventDefault();
  });

  // the frame follows the window
  let size = `${svg.clientWidth}x${svg.clientHeight}`;
  new ResizeObserver(() => {
    const s = `${svg.clientWidth}x${svg.clientHeight}`;
    if (s === size) return;
    size = s;
    // turning the phone: swap the figure and show all of it again
    if (shapeFor() !== shape) {
      arrange(shapeFor());
      set(homeBox());
    } else set(fill(vb));
  }).observe(svg);

  /* ── start ── */
  set(homeBox());
  const hash = decodeURIComponent(location.hash.replace(/^#[si]-/, ''));
  if (location.hash && stars.has(hash)) {
    // a link to a star opens the map on it, not on the list below
    scrollTo(0, 0);
    requestAnimationFrame(() => select(hash));
  }

  if (!reducedMotion()) {
    primeBurst(root.querySelector<SVGGElement>('[data-field]'), 0.08);
    play(root, 'is-arriving', 3200);
  }
  try {
    sessionStorage.removeItem('oq.dive');
  } catch {
    /* nothing to clear */
  }
}
