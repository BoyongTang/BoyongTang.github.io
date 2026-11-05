import { labelLeft, PILLARS } from '../data/pillars';
import { fitPillars } from '../lib/pillars-fit';
import { reducedMotion } from './form';

// The Pillars of Creation as a map to explore (src/components/Explorer.astro). The camera is a point of the
// image at the centre of the view and a scale (screen px per image px). Everything on top (the five parts,
// an open part's stars) is placed from it every frame, and the living sky behind the page reads it too
// (window.__oqView, see src/scripts/backdrop.ts).

type Shape = 'wide' | 'tall';
interface Lay {
  cx: number;
  cy: number;
  w: number;
  h: number;
  pts: { id: string; x: number; y: number; side: 'left' | 'right' }[];
}
interface Part {
  id: string;
  spot: [number, number];
  wide: Lay;
  tall: Lay;
}
interface Cam {
  cx: number;
  cy: number;
  s: number;
}
export type ViewRect = { x: number; y: number; w: number; h: number };

const W = PILLARS.size.w;
const H = PILLARS.size.h;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

declare global {
  interface Window {
    __oqView?: ViewRect;
  }
}

export function initExplorer(root: HTMLElement) {
  const html = document.documentElement;
  const parts: Part[] = JSON.parse(root.dataset.parts ?? '[]');
  const byId = new Map(parts.map((p) => [p.id, p]));
  const still = root.querySelector<HTMLImageElement>('[data-still]')!;
  // without the living sky, the parts come out with the still image
  const ready = () => html.classList.add('sky-ready');
  if (!html.classList.contains('has-gl')) {
    if (still.complete) ready();
    else still.addEventListener('load', ready, { once: true });
  }
  // whatever happens to the sky, never leave the parts hidden for long
  setTimeout(ready, 4000);
  const card = root.querySelector<HTMLElement>('[data-card]')!;
  const cardBody = root.querySelector<HTMLElement>('[data-card-body]')!;
  const markers = new Map<string, HTMLAnchorElement>();
  root.querySelectorAll<HTMLAnchorElement>('[data-part]').forEach((a) => markers.set(a.dataset.part!, a));
  const groups = new Map<string, SVGGElement>();
  root.querySelectorAll<SVGGElement>('[data-xpart]').forEach((g) => groups.set(g.dataset.xpart!, g));
  const opens = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-open]').forEach((o) => opens.set(o.dataset.open!, o));
  const starsOf = (id: string) => [...(groups.get(id)?.querySelectorAll<SVGAElement>('[data-star]') ?? [])];
  const partOfStar = new Map<string, string>();
  groups.forEach((g, id) => g.querySelectorAll<SVGAElement>('[data-star]').forEach((a) => partOfStar.set(a.dataset.star!, id)));
  const home = root.dataset.home === '1';

  root.classList.add('is-live');

  let w = root.clientWidth;
  let h = root.clientHeight;
  const shape = (): Shape => (w / Math.max(1, h) >= 0.9 ? 'wide' : 'tall');

  /** The whole pillars, framed as the page was designed. */
  const overview = (): Cam => {
    const fit = fitPillars(w, h);
    const [x0, y0] = fit.at(0, 0);
    const [x1] = fit.at(1, 1);
    const s = (x1 - x0) / W;
    return { cx: (w / 2 - x0) / s, cy: (h / 2 - y0) / s, s };
  };
  let ov = overview();
  let cam: Cam = { ...ov };
  const sMin = () => ov.s; // never smaller than filling the screen
  // the upscaled picture holds detail to about 3 screen px per frame px
  const sMax = () => Math.max(ov.s * 4, 3);
  /** Keep the view on the photo: wider than the window, it fills it; narrower, it stays within it. */
  const clampCam = (c: Cam): Cam => {
    const s = Math.min(sMax(), Math.max(sMin(), c.s));
    const range = (size: number, view: number) => {
      const a = view / (2 * s);
      return [Math.min(a, size - a), Math.max(a, size - a)];
    };
    const [x0, x1] = range(W, w);
    const [y0, y1] = range(H, h);
    return { s, cx: Math.min(x1, Math.max(x0, c.cx)), cy: Math.min(y1, Math.max(y0, c.cy)) };
  };
  const toScreen = (x: number, y: number): [number, number] => [w / 2 + (x - cam.cx) * cam.s, h / 2 + (y - cam.cy) * cam.s];

  let current: string | null = null;
  let sharp = false;

  /* ── placing everything from the camera ── */
  function apply() {
    const rr = root.getBoundingClientRect();
    window.__oqView = { x: rr.left + w / 2 - cam.cx * cam.s, y: rr.top + h / 2 - cam.cy * cam.s, w: W * cam.s, h: H * cam.s };
    const sh = shape();

    for (const p of parts) {
      const a = markers.get(p.id)!;
      const [x, y] = toScreen(p.spot[0] * W, p.spot[1] * H);
      a.style.left = `${x.toFixed(1)}px`;
      a.style.top = `${y.toFixed(1)}px`;
      // each part's label keeps its side (src/data/pillars.ts), unless it would run off the screen
      const side = labelLeft[p.id as keyof typeof labelLeft][sh];
      const flip = x + 125 > w ? true : x - 125 < 0 ? false : side;
      a.classList.toggle('part--flip-wide', flip);
      a.classList.toggle('part--flip-tall', flip);
    }

    if (current) {
      const lay = byId.get(current)![sh];
      const pos = new Map<string, [number, number]>();
      for (const pt of lay.pts) pos.set(pt.id, toScreen(pt.x, pt.y));
      for (const a of starsOf(current)) {
        const pt = lay.pts.find((q) => q.id === a.dataset.star)!;
        const [x, y] = pos.get(pt.id)!;
        a.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        const left = pt.side === 'left';
        for (const [t, em] of [
          [a.querySelector('.xstar__name'), 1.5],
          [a.querySelector('.xstar__sub'), 2.4],
        ] as const) {
          t?.setAttribute('text-anchor', left ? 'end' : 'start');
          t?.setAttribute('dx', `${left ? -em : em}em`);
        }
      }
      groups.get(current)!.querySelectorAll<SVGLineElement>('.xline').forEach((l) => {
        const a = pos.get(l.dataset.a!);
        const b = pos.get(l.dataset.b!);
        if (!a || !b) return;
        l.setAttribute('x1', a[0].toFixed(1));
        l.setAttribute('y1', a[1].toFixed(1));
        l.setAttribute('x2', b[0].toFixed(1));
        l.setAttribute('y2', b[1].toFixed(1));
      });
    }

    // the still image (no WebGL) moves with the camera
    if (!html.classList.contains('has-gl')) {
      still.classList.add('is-placed');
      Object.assign(still.style, {
        width: `${W * cam.s}px`,
        height: `${H * cam.s}px`,
        transform: `translate(${(w / 2 - cam.cx * cam.s).toFixed(1)}px, ${(h / 2 - cam.cy * cam.s).toFixed(1)}px)`,
      });
    }

    const zr = cam.s / ov.s;

    // closer in, a sharper copy of the photo
    if (!sharp && zr > 1.7) {
      sharp = true;
      dispatchEvent(new CustomEvent('pillars:sharpen'));
      if (!html.classList.contains('has-gl')) still.src = '/sky/pillars-max.webp';
    }
  }

  /* ── camera moves ── */
  let frame = 0;
  function set(c: Cam) {
    cam = clampCam(c);
    apply();
  }

  function flyTo(target: Cam, ms = 900, done?: () => void) {
    cancelAnimationFrame(frame);
    stopGlide();
    const to = clampCam(target);
    if (reducedMotion() || ms === 0) {
      set(to);
      done?.();
      return;
    }
    const from = { ...cam };
    const t0 = performance.now();
    // zoom on a log scale, so flying in and out feels even
    const ls0 = Math.log(from.s);
    const ls1 = Math.log(to.s);
    const step = (now: number) => {
      const k = inOut(Math.min(1, (now - t0) / ms));
      set({ cx: from.cx + (to.cx - from.cx) * k, cy: from.cy + (to.cy - from.cy) * k, s: Math.exp(ls0 + (ls1 - ls0) * k) });
      if (k < 1) frame = requestAnimationFrame(step);
      else done?.();
    };
    frame = requestAnimationFrame(step);
  }

  /** Zoom by k about a screen point, keeping the image point under it in place. */
  function zoomAt(k: number, sx: number, sy: number, ms = 0) {
    const s = Math.min(sMax(), Math.max(sMin(), cam.s * k));
    const ix = cam.cx + (sx - w / 2) / cam.s;
    const iy = cam.cy + (sy - h / 2) / cam.s;
    const target = { s, cx: ix - (sx - w / 2) / s, cy: iy - (sy - h / 2) / s };
    if (ms) flyTo(target, ms, settle);
    else {
      set(target);
      settleSoon();
    }
  }

  /* ── opening a part ── */
  function frameFor(id: string): Cam {
    const lay = byId.get(id)![shape()];
    const wide = shape() === 'wide';
    const s = Math.min(sMax(), Math.max(ov.s * 1.8, Math.min((w * (wide ? 0.86 : 0.9)) / lay.w, (h * (wide ? 0.72 : 0.5)) / lay.h)));
    // a little low, to leave room for the title (top left); on phones high, above where a card opens
    return { s, cx: lay.cx, cy: lay.cy - (wide ? (h * 0.06) / s : (h * 0.1) / s) };
  }

  function openPart(id: string, { fly = true } = {}) {
    if (!byId.has(id)) return;
    const was = current;
    current = id;
    root.classList.add('is-open');
    groups.forEach((g, gid) => g.classList.toggle('is-open', gid === id));
    markers.forEach((a, mid) => a.classList.toggle('is-current', mid === id));
    opens.forEach((o, oid) => (o.hidden = oid !== id));
    groups.forEach((g, gid) => g.querySelectorAll('[data-star]').forEach((a) => a.setAttribute('tabindex', gid === id ? '0' : '-1')));
    if (was !== id) closeCard();
    if (home) history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
    if (fly) flyTo(frameFor(id));
    else apply();
  }

  function closePart({ fly = false } = {}) {
    if (!current) return;
    const last = current;
    current = null;
    closeCard();
    root.classList.remove('is-open');
    groups.forEach((g) => g.classList.remove('is-open'));
    markers.forEach((a) => a.classList.remove('is-current'));
    opens.forEach((o) => (o.hidden = true));
    if (home) history.replaceState(null, '', location.pathname + location.search);
    if (fly) flyTo(ov, 900);
    else apply();
    markers.get(last)?.focus({ preventScroll: true });
  }

  /** After a move: close in on a part opens it; pulling back far enough closes it. */
  function settle() {
    const zr = cam.s / ov.s;
    if (current && zr < 1.45) return closePart();
    if (current || zr < 2.1) return;
    let best: string | null = null;
    let bd = Infinity;
    for (const p of parts) {
      const lay = p[shape()];
      const d = Math.hypot(lay.cx - cam.cx, lay.cy - cam.cy) * cam.s;
      if (d < bd) {
        bd = d;
        best = p.id;
      }
    }
    if (best && bd < Math.min(w, h) * 0.38) openPart(best); // and glide over to frame it
  }
  let settleTimer = 0;
  const settleSoon = () => {
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 260);
  };

  /* ── a star's card ── */
  let selected: string | null = null;
  function select(id: string) {
    const part = partOfStar.get(id);
    const entry = document.querySelector<HTMLElement>(`[data-entry="${CSS.escape(id)}"]`);
    if (!part || !entry) return;
    if (current !== part) openPart(part, { fly: false });
    selected = id;
    root.querySelectorAll('[data-star]').forEach((a) => a.classList.toggle('is-selected', (a as HTMLElement).dataset.star === id));
    cardBody.replaceChildren(entry.cloneNode(true));
    card.style.setProperty('--c', getComputedStyle(groups.get(part)!).getPropertyValue('--c'));
    card.hidden = false;
    history.replaceState(null, '', `${location.pathname}${location.search}#s-${id}`);
    // keep the star clear of the card
    const pt = byId.get(part)![shape()].pts.find((q) => q.id === id)!;
    const [x, y] = toScreen(pt.x, pt.y);
    if (shape() === 'wide' && x > w - 440) flyTo({ ...cam, cx: cam.cx + (x - (w - 520)) / cam.s }, 500);
    if (shape() === 'tall' && y > h * 0.4) flyTo({ ...cam, cy: cam.cy + (y - h * 0.3) / cam.s }, 500);
  }
  function closeCard() {
    if (!selected) return;
    const last = root.querySelector<SVGAElement>(`[data-star="${CSS.escape(selected)}"]`);
    selected = null;
    root.querySelectorAll('[data-star]').forEach((a) => a.classList.remove('is-selected'));
    card.hidden = true;
    if (current && home) history.replaceState(null, '', `${location.pathname}${location.search}#${current}`);
    last?.focus({ preventScroll: true });
  }
  root.querySelector('[data-close]')?.addEventListener('click', closeCard);
  card.addEventListener('click', (ev) => {
    const a = (ev.target as Element).closest<HTMLAnchorElement>('[data-goto]');
    if (!a) return;
    ev.preventDefault();
    select(a.dataset.goto!);
  });

  /* ── dragging, gliding, pinching ── */
  const pts = new Map<number, { x: number; y: number }>();
  let moved = 0;
  let pinch = 0;
  let vel = { x: 0, y: 0, t: 0 };
  let glide = 0;
  const stopGlide = () => cancelAnimationFrame(glide);
  const ui = (t: EventTarget | null) => (t as Element | null)?.closest?.('.ex__card, .ex__foot, .ex__home, button');

  root.addEventListener('pointerdown', (ev) => {
    if (ui(ev.target) || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    cancelAnimationFrame(frame);
    stopGlide();
    pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pts.size === 1) {
      moved = 0;
      vel = { x: 0, y: 0, t: performance.now() };
    }
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  root.addEventListener('pointermove', (ev) => {
    const last = pts.get(ev.pointerId);
    if (!last) return;
    const now = { x: ev.clientX, y: ev.clientY };
    pts.set(ev.pointerId, now);
    if (pts.size === 1) {
      const dx = now.x - last.x;
      const dy = now.y - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 4 && !root.hasPointerCapture(ev.pointerId)) {
        root.setPointerCapture(ev.pointerId); // a drag, not a tap: keep it even off the map
        root.classList.add('is-dragging');
      }
      const t = performance.now();
      const dt = Math.max(1, t - vel.t);
      vel = { x: dx / dt, y: dy / dt, t };
      set({ ...cam, cx: cam.cx - dx / cam.s, cy: cam.cy - dy / cam.s });
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const rr = root.getBoundingClientRect();
      if (pinch) zoomAt(d / pinch, (a.x + b.x) / 2 - rr.left, (a.y + b.y) / 2 - rr.top);
      pinch = d;
      moved += 10;
    }
  });

  const up = (ev: PointerEvent) => {
    if (!pts.has(ev.pointerId)) return;
    pts.delete(ev.pointerId);
    if (pts.size < 2) pinch = 0;
    if (pts.size) return;
    root.classList.remove('is-dragging');
    // let it glide on a little
    if (moved > 4 && !reducedMotion() && performance.now() - vel.t < 80) {
      let { x: vx, y: vy } = vel;
      let t = performance.now();
      const step = (n: number) => {
        const dt = n - t;
        t = n;
        vx *= Math.pow(0.92, dt / 16);
        vy *= Math.pow(0.92, dt / 16);
        set({ ...cam, cx: cam.cx - (vx * dt) / cam.s, cy: cam.cy - (vy * dt) / cam.s });
        if (Math.hypot(vx, vy) > 0.02) glide = requestAnimationFrame(step);
        else settle();
      };
      glide = requestAnimationFrame(step);
    } else if (moved > 4) settle();
  };
  root.addEventListener('pointerup', up);
  root.addEventListener('pointercancel', up);

  root.addEventListener(
    'wheel',
    (ev) => {
      // pulled all the way out, the wheel scrolls the page on to what is below
      if (ev.deltaY > 0 && cam.s <= sMin() * 1.001 && !ev.ctrlKey && document.documentElement.scrollHeight > innerHeight + 4) return;
      ev.preventDefault();
      const rr = root.getBoundingClientRect();
      const d = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
      zoomAt(Math.exp(-d * (ev.ctrlKey ? 0.01 : 0.0018)), ev.clientX - rr.left, ev.clientY - rr.top);
    },
    { passive: false },
  );

  root.addEventListener('dblclick', (ev) => {
    if (ui(ev.target) || (ev.target as Element).closest('[data-star], [data-part]')) return;
    const rr = root.getBoundingClientRect();
    zoomAt(1.9, ev.clientX - rr.left, ev.clientY - rr.top, 450);
  });

  /* ── choosing ── */
  markers.forEach((a, id) =>
    a.addEventListener('click', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return; // a new tab gets the part's own page
      ev.preventDefault();
      if (ev.detail !== 0 && moved > 6) return;
      openPart(id);
    }),
  );
  root.querySelectorAll<SVGAElement>('[data-star]').forEach((a) =>
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (ev.detail !== 0 && moved > 6) return;
      select(a.dataset.star!);
    }),
  );
  // a click anywhere else steps back: first the card, then the open part
  root.addEventListener('click', (ev) => {
    if (moved > 6 || ui(ev.target) || (ev.target as Element).closest('[data-star], [data-part]')) return;
    if (selected) closeCard();
    else if (current) closePart({ fly: true });
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target instanceof Element ? ev.target : null;
    if (t?.closest('input, textarea, select, [contenteditable]')) return;
    const rr = root.getBoundingClientRect();
    if (rr.bottom < innerHeight * 0.5) return; // the map is scrolled away
    const pan = (dx: number, dy: number) => flyTo({ ...cam, cx: cam.cx + (dx * w * 0.2) / cam.s, cy: cam.cy + (dy * h * 0.2) / cam.s }, 220, settle);
    switch (ev.key) {
      case 'ArrowLeft': pan(-1, 0); break;
      case 'ArrowRight': pan(1, 0); break;
      case 'ArrowUp': pan(0, -1); break;
      case 'ArrowDown': pan(0, 1); break;
      case '+': case '=': zoomAt(1.5, w / 2, h / 2, 260); break;
      case '-': case '_': zoomAt(1 / 1.5, w / 2, h / 2, 260); break;
      case '0': current ? closePart({ fly: true }) : flyTo(ov); break;
      case 'Escape':
        if (selected) closeCard();
        else if (current) closePart({ fly: true });
        else return;
        break;
      default: return;
    }
    ev.preventDefault();
  });

  /* ── the window ── */
  addEventListener('scroll', apply, { passive: true });
  new ResizeObserver(() => {
    const nw = root.clientWidth;
    const nh = root.clientHeight;
    if (nw === w && nh === h) return;
    const zr = cam.s / ov.s;
    w = nw;
    h = nh;
    ov = overview();
    if (current) set(frameFor(current));
    else set(zr < 1.02 ? ov : { ...cam, s: ov.s * zr });
  }).observe(root);

  /* ── start: a part's own page, a shared link (#research, #s-python), or the whole pillars ── */
  const hash = decodeURIComponent(location.hash.slice(1));
  const star = hash.replace(/^[si]-/, '');
  if (partOfStar.has(star) && /^[si]-/.test(hash)) {
    openPart(partOfStar.get(star)!, { fly: false });
    set(frameFor(current!));
    requestAnimationFrame(() => select(star));
    scrollTo(0, 0);
  } else if (root.dataset.focus || byId.has(hash)) {
    openPart(root.dataset.focus || hash, { fly: false });
    set(frameFor(current!));
  } else apply();

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
    root.addEventListener(
      'pointerdown',
      () => {
        clearTimeout(t);
        end();
      },
      { once: true },
    );
  }
}
