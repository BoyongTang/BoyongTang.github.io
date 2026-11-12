import { labelLeft, PILLARS } from '../data/pillars';
import { fitPillars, shapeFor, type Shape } from '../lib/pillars-fit';
import { reducedMotion } from './motion';

// The Pillars of Creation as a map to explore (src/components/Explorer.astro). The camera is a point of the
// image at the centre of the view and a scale (screen px per image px). Everything on top (the parts,
// an open part's stars) is placed from it every frame, and the living sky behind the page reads it too
// (window.__oqView, see src/scripts/backdrop.ts). Visitors cannot zoom or drag: choosing a part flies the
// camera in to it, and its star chains come out once it arrives (the profile part opens the profile card
// instead); stepping back flies out to the whole view.

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
/** How much closer an open part is than the whole view, and the sharpest the photo is shown. */
const ZOOM = 2.2;
const MAX_SCALE = 1.2;
const FLY_IN = 1100;
const FLY_OUT = 900;

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
  const profilePart = root.dataset.profilePart ?? '';

  root.classList.add('is-live');

  let w = root.clientWidth;
  let h = root.clientHeight;
  const shape = (): Shape => shapeFor(w, h);

  /** The whole pillars, framed as the page was designed. */
  const overview = (): Cam => {
    const fit = fitPillars(w, h);
    const [x0, y0] = fit.at(0, 0);
    const [x1] = fit.at(1, 1);
    const s = (x1 - x0) / W;
    return { cx: (w / 2 - x0) / s, cy: (h / 2 - y0) / s, s };
  };
  // the whole view: the framed pillars
  let ov = overview();
  let cam: Cam = { ...ov };

  /** Close in on a part: its place on the pillars at the centre, the photo's top and foot kept in view. */
  const focus = (id: string): Cam => {
    const [sx, sy] = byId.get(id)!.spot;
    const s = Math.max(ov.s, Math.min(ov.s * ZOOM, MAX_SCALE));
    const half = h / 2 / s;
    const cy = half * 2 >= H ? H / 2 : Math.min(H - half, Math.max(half, sy * H));
    return { cx: sx * W, cy, s };
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
      // size it for its labels (laid out for ~21-unit type, shown at ~13 px), whatever the photo's scale: its
      // frame (which already holds the labels) fits the screen, centred on the part's place, kept inside the
      // edges and clear of the caption at the foot
      if (pos.size) {
        const want = Math.min(0.62, ((w - 24) / lay.vw) * 0.9, (h - 140) / lay.vh);
        // squeezed smaller than designed, the type gives a little too (never below 80 %)
        groups.get(current)!.style.setProperty('--xs', Math.max(0.8, Math.min(1, want / 0.62)).toFixed(3));
        const k = want / ((lay.w / lay.vw) * cam.s);
        // centred on the part's place (where the camera flies to), kept on screen
        const spot = byId.get(current)!.spot;
        let [cx, cy] = toScreen(spot[0] * W, spot[1] * H);
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
      // a part with no stars yet shows its "uncharted" mark on its place
      const empty = groups.get(current)!.querySelector('[data-empty]');
      if (empty) {
        const spot = byId.get(current)!.spot;
        const [x, y] = toScreen(spot[0] * W, spot[1] * H);
        empty.setAttribute('transform', `translate(${x.toFixed(1)} ${Math.min(h - 170, y).toFixed(1)})`);
      }
    }
    placeCard();

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
  let flight = 0;
  let guard = 0;
  /** What to do once the camera is where it is going (an open part's stars come out). */
  let arrive: (() => void) | undefined;
  const land = () => {
    const f = arrive;
    arrive = undefined;
    f?.();
  };

  /** Jump the camera to `c`, ending any flight there and then. */
  function set(c: Cam) {
    cancelAnimationFrame(flight);
    clearTimeout(guard);
    root.classList.remove('is-flying');
    cam = c;
    apply();
    land();
  }

  /** Fly the camera to `to`, then call `done`. Scale eases in log space, so zooming feels even. */
  function flyTo(to: Cam, ms: number, done?: () => void) {
    cancelAnimationFrame(flight);
    clearTimeout(guard);
    arrive = done;
    if (reducedMotion() || ms <= 0) {
      set(to);
      return;
    }
    const from = { ...cam };
    const t0 = performance.now();
    root.classList.add('is-flying');
    // a tab in the background draws no frames: land on time anyway, so the stars still come out
    guard = window.setTimeout(() => set(to), ms + 250);
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = inOut(t);
      const s = from.s * Math.pow(to.s / from.s, e);
      // the point at the centre moves in step with how far the view has closed in (or opened out), so the
      // part slides to the middle as the zoom goes, without swinging past it
      const k = from.s === to.s ? e : (1 / from.s - 1 / s) / (1 / from.s - 1 / to.s);
      cam = { cx: from.cx + (to.cx - from.cx) * k, cy: from.cy + (to.cy - from.cy) * k, s };
      apply();
      if (t < 1) flight = requestAnimationFrame(step);
      else set(to);
    };
    flight = requestAnimationFrame(step);
  }

  /* ── opening a part ── */
  /** Open a part: fly in to it, then its stars unfold. `now` skips the flight (a page opened on a part). */
  function openPart(id: string, now = false) {
    if (!byId.has(id)) return;
    const was = current;
    current = id;
    root.classList.add('is-open');
    markers.forEach((a, mid) => a.classList.toggle('is-current', mid === id));
    opens.forEach((o, oid) => (o.hidden = oid !== id));
    groups.forEach((g, gid) => g.querySelectorAll('[data-star]').forEach((a) => a.setAttribute('tabindex', gid === id ? '0' : '-1')));
    if (was !== id) closeCard();
    if (home) history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
    if (was === id && groups.get(id)?.classList.contains('is-open')) return;
    // the stars come out once the camera is there
    groups.forEach((g) => g.classList.remove('is-open'));
    flyTo(focus(id), now ? 0 : FLY_IN, () => {
      if (current !== id) return;
      groups.get(id)?.classList.add('is-open');
      if (id === profilePart) showProfile();
    });
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
    flyTo(ov, FLY_OUT);
    markers.get(last)?.focus({ preventScroll: true });
  }

  /* ── a star's card ── */
  let selected: string | null = null;
  /**
   * On wide screens a star's card opens beside its star (and its label): to the right if there is room,
   * else to the left, level with the star and kept on screen. Where neither side has room, and for the
   * profile card, it keeps its corner; on tall screens it is a sheet at the foot.
   */
  function placeCard() {
    const star = selected && selected !== 'profile' ? root.querySelector<SVGAElement>(`[data-star="${CSS.escape(selected)}"]`) : null;
    card.classList.remove('is-beside');
    card.style.removeProperty('left');
    card.style.removeProperty('top');
    if (!star || card.hidden || shape() === 'tall') return;
    const rr = root.getBoundingClientRect();
    const sr = star.getBoundingClientRect();
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const gap = 18;
    const mid = sr.top - rr.top + sr.height / 2;
    const y = Math.max(12, Math.min(h - ch - 12, mid - ch / 2));
    // of the sides that fit, the one that hides fewer of the part's other stars (the right on a tie)
    const others = starsOf(current ?? '')
      .filter((a) => a !== star)
      .map((a) => {
        const r = a.querySelector('.xstar__core')!.getBoundingClientRect();
        return [r.left + r.width / 2 - rr.left, r.top + r.height / 2 - rr.top];
      });
    const hidden = (x: number) => others.filter(([px, py]) => px > x - 8 && px < x + cw + 8 && py > y - 8 && py < y + ch + 8).length;
    const sides = [sr.right - rr.left + gap, sr.left - rr.left - gap - cw].filter((x) => x >= 12 && x + cw <= w - 12);
    if (!sides.length) return;
    const x = sides.reduce((best, s) => (hidden(s) < hidden(best) ? s : best));
    card.classList.add('is-beside');
    card.style.left = `${x.toFixed(0)}px`;
    card.style.top = `${y.toFixed(0)}px`;
  }
  function select(id: string) {
    const part = partOfStar.get(id);
    const entry = document.querySelector<HTMLElement>(`[data-entry="${CSS.escape(id)}"]`);
    if (!part || !entry) return;
    if (current !== part) openPart(part);
    selected = id;
    card.classList.remove('is-profile');
    root.querySelectorAll('[data-star]').forEach((a) => a.classList.toggle('is-selected', (a as HTMLElement).dataset.star === id));
    cardBody.replaceChildren(entry.cloneNode(true));
    card.style.setProperty('--c', getComputedStyle(groups.get(part)!).getPropertyValue('--c'));
    card.hidden = false;
    placeCard();
    // the figure may still be loading: place it again once the card has its full height
    cardBody.querySelectorAll('img').forEach((img) => img.complete || img.addEventListener('load', placeCard, { once: true }));
    history.replaceState(null, '', `${location.pathname}${location.search}#s-${id}`);
  }
  /** The profile part's one card: who I am, from src/data/profile.ts. */
  function showProfile() {
    const entry = root.querySelector<HTMLElement>('[data-entry="profile"]');
    if (!entry || !current) return;
    selected = 'profile';
    // no star to sit beside: the profile card takes the middle of the screen
    card.classList.add('is-profile');
    cardBody.replaceChildren(entry.cloneNode(true));
    card.style.setProperty('--c', getComputedStyle(groups.get(current)!).getPropertyValue('--c'));
    card.hidden = false;
    placeCard();
  }
  /** One step back: a star's card, then the open part (the profile card is the whole part, so both). */
  function back() {
    if (selected && selected !== 'profile') closeCard();
    else if (current) closePart();
  }
  function closeCard() {
    if (!selected) return;
    const last = root.querySelector<SVGAElement>(`[data-star="${CSS.escape(selected)}"]`);
    selected = null;
    root.querySelectorAll('[data-star]').forEach((a) => a.classList.remove('is-selected'));
    card.hidden = true;
    card.classList.remove('is-profile');
    if (current && home) history.replaceState(null, '', `${location.pathname}${location.search}#${current}`);
    last?.focus({ preventScroll: true });
  }
  root.querySelector('[data-close]')?.addEventListener('click', back);
  card.addEventListener('click', (ev) => {
    const a = (ev.target as Element).closest<HTMLAnchorElement>('[data-goto]');
    if (!a) return;
    ev.preventDefault();
    select(a.dataset.goto!);
  });

  const ui = (t: EventTarget | null) => (t as Element | null)?.closest?.('.ex__card, .ex__foot, .ex__home, .ex__more, button');

  /* ── choosing ── */
  markers.forEach((a, id) =>
    a.addEventListener('click', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return; // a new tab gets the part's own page
      ev.preventDefault();
      openPart(id);
    }),
  );
  root.querySelectorAll<SVGAElement>('[data-star]').forEach((a) =>
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      select(a.dataset.star!);
    }),
  );
  // a click anywhere else steps back: first the card, then the open part
  root.addEventListener('click', (ev) => {
    if (ui(ev.target) || (ev.target as Element).closest('[data-star], [data-part]')) return;
    back();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') back();
  });

  /* ── the window ── */
  // the home page scrolls on to its second screen: the sky's pillars (placed from __oqView) move up with it
  let scrollQueued = false;
  addEventListener(
    'scroll',
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        apply();
      });
    },
    { passive: true },
  );

  new ResizeObserver(() => {
    const nw = root.clientWidth;
    const nh = root.clientHeight;
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    ov = overview();
    set(current ? focus(current) : ov);
  }).observe(root);

  /* ── start: a part's own page, a shared link (#research, #s-python), or the whole pillars ── */
  const hash = decodeURIComponent(location.hash.slice(1));
  const star = hash.replace(/^[si]-/, '');
  if (partOfStar.has(star) && /^[si]-/.test(hash)) {
    openPart(partOfStar.get(star)!, true);
    requestAnimationFrame(() => select(star));
    scrollTo(0, 0);
  } else if (root.dataset.focus || byId.has(hash)) {
    openPart(root.dataset.focus || hash, true);
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
