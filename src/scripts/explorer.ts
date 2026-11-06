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
  /** The constellation's own frame, in the units its labels were laid out for. */
  vw: number;
  vh: number;
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
  // the view is fixed: the framed pillars, nothing to zoom or drag
  let ov = overview();
  let cam: Cam = { ...ov };
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
      // size it for its labels (laid out for ~21-unit type, shown at ~13 px), whatever the photo's scale: its
      // frame (which already holds the labels) fits the screen, centred on the part's place, kept inside the
      // edges and clear of the caption at the foot
      if (pos.size) {
        const want = Math.min(0.62, ((w - 24) / lay.vw) * 0.9, (h - 140) / lay.vh);
        // squeezed smaller than designed, the type gives a little too (never below 80 %)
        groups.get(current)!.style.setProperty('--xs', Math.max(0.8, Math.min(1, want / 0.62)).toFixed(3));
        const k = want / ((lay.w / lay.vw) * cam.s);
        let [cx, cy] = toScreen(lay.cx, lay.cy);
        const hw = (lay.vw * want) / 2;
        const hh = (lay.vh * want) / 2;
        cx = Math.min(w - 12 - hw, Math.max(12 + hw, cx));
        cy = Math.min(h - 120 - hh, Math.max(12 + hh, cy));
        const [ox, oy] = toScreen(lay.cx, lay.cy);
        pos.forEach((p) => {
          p[0] = cx + (p[0] - ox) * k;
          p[1] = cy + (p[1] - oy) * k;
        });
      }
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
      groups.get(current)!.querySelectorAll<SVGTextElement>('[data-chain]').forEach((t) => {
        const p = pos.get(t.dataset.chain!);
        if (p) t.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);
      });
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

    // on a large, sharp screen, the full-size copy of the photo
    if (!sharp && W * cam.s * (devicePixelRatio || 1) > 1900) {
      sharp = true;
      dispatchEvent(new CustomEvent('pillars:sharpen'));
      if (!html.classList.contains('has-gl')) still.src = '/sky/pillars-max.webp';
    }
  }

  /* ── the view ── */
  function set(c: Cam) {
    cam = c;
    apply();
  }

  /* ── opening a part ── */
  /** Open a part: its stars unfold where it is. */
  function openPart(id: string) {
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
    apply();
  }

  function closePart() {
    if (!current) return;
    const last = current;
    current = null;
    closeCard();
    root.classList.remove('is-open');
    groups.forEach((g) => g.classList.remove('is-open'));
    markers.forEach((a) => a.classList.remove('is-current'));
    opens.forEach((o) => (o.hidden = true));
    if (home) history.replaceState(null, '', location.pathname + location.search);
    apply();
    markers.get(last)?.focus({ preventScroll: true });
  }

  /* ── a star's card ── */
  let selected: string | null = null;
  function select(id: string) {
    const part = partOfStar.get(id);
    const entry = document.querySelector<HTMLElement>(`[data-entry="${CSS.escape(id)}"]`);
    if (!part || !entry) return;
    if (current !== part) openPart(part);
    selected = id;
    root.querySelectorAll('[data-star]').forEach((a) => a.classList.toggle('is-selected', (a as HTMLElement).dataset.star === id));
    cardBody.replaceChildren(entry.cloneNode(true));
    card.style.setProperty('--c', getComputedStyle(groups.get(part)!).getPropertyValue('--c'));
    card.hidden = false;
    history.replaceState(null, '', `${location.pathname}${location.search}#s-${id}`);
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

  const moved = 0; // nothing drags any more; kept so a click is always a click
  const ui = (t: EventTarget | null) => (t as Element | null)?.closest?.('.ex__card, .ex__foot, .ex__home, button');

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
    else if (current) closePart();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    if (selected) closeCard();
    else if (current) closePart();
  });

  /* ── the window ── */
  addEventListener('scroll', apply, { passive: true });
  new ResizeObserver(() => {
    const nw = root.clientWidth;
    const nh = root.clientHeight;
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    ov = overview();
    set(ov);
  }).observe(root);

  /* ── start: a part's own page, a shared link (#research, #s-python), or the whole pillars ── */
  const hash = decodeURIComponent(location.hash.slice(1));
  const star = hash.replace(/^[si]-/, '');
  if (partOfStar.has(star) && /^[si]-/.test(hash)) {
    openPart(partOfStar.get(star)!);
    requestAnimationFrame(() => select(star));
    scrollTo(0, 0);
  } else if (root.dataset.focus || byId.has(hash)) {
    openPart(root.dataset.focus || hash);
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
