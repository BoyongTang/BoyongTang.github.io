import { galaxies } from '../data/galaxies';
import { galaxyStars } from '../lib/stars';
import { play, primeBurst, reducedMotion, stop } from './form';

// Progressive enhancement for the research universe. Without this script every galaxy is a plain link
// to its own page and the List view is still in the page.

const VIEW = { x: 0, y: 0, w: 1000, h: 700 };
type Box = typeof VIEW;

const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out = (t: number) => 1 - Math.pow(1 - t, 4);

/** Opening timeline (ms). Galaxies form one after another; see the .is-intro / .is-forming CSS. */
const INTRO = { dolly: 2700, firstGalaxy: 750, between: 380, end: 3500, greet: 1800 };

export function initUniverse(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('[data-svg]')!;
  const mapEl = root.querySelector<HTMLElement>('[data-map]')!;
  const listEl = root.querySelector<HTMLElement>('[data-list]')!;
  const panelWrap = root.querySelector<HTMLElement>('[data-panels]')!;
  const galaxyEls = new Map<string, SVGAElement>();
  root.querySelectorAll<SVGAElement>('[data-galaxy]').forEach((el) => galaxyEls.set(el.dataset.galaxy!, el));
  const wraps = new Map<string, SVGGElement>();
  root.querySelectorAll<SVGGElement>('[data-wrap]').forEach((el) => wraps.set(el.dataset.wrap!, el));
  const panels = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-panel]').forEach((el) => panels.set(el.dataset.panel!, el));

  let selected: string | null = null;
  let vb: Box = { ...VIEW };
  let frame = 0;
  let settle = 0;

  const setView = (b: Box) => {
    vb = b;
    svg.setAttribute('viewBox', `${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}`);
  };

  /** Restrained camera move (B1 §10.2: 200–350 ms for a reset, instant under reduced motion). */
  function moveTo(target: Box, ms = 520, ease = inOut) {
    cancelAnimationFrame(frame);
    clearTimeout(settle);
    if (reducedMotion()) return setView(target);
    // background tabs pause animation frames: always land on the target
    settle = window.setTimeout(() => {
      cancelAnimationFrame(frame);
      setView(target);
    }, ms + 80);
    const from = { ...vb };
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const k = ease(t);
      setView({
        x: from.x + (target.x - from.x) * k,
        y: from.y + (target.y - from.y) * k,
        w: from.w + (target.w - from.w) * k,
        h: from.h + (target.h - from.h) * k,
      });
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }

  /** Frame the galaxy; on wide maps leave the right side free for the panel. */
  function boxFor(el: SVGAElement): Box {
    const x = Number(el.dataset.x);
    const y = Number(el.dataset.y);
    const r = Number(el.dataset.r);
    const side = mapEl.clientWidth >= 640;
    const w = r * (side ? 4.1 : 2.8);
    const h = w * (VIEW.h / VIEW.w);
    return { x: x - w / 2 + (side ? w * 0.21 : 0), y: y - h / 2, w, h };
  }

  /** The dense star layer is built on first entry, so the page itself stays light. */
  function fillDense(id: string) {
    const layer = wraps.get(id)?.querySelector<SVGGElement>('[data-dense]');
    const g = galaxies.find((x) => x.id === id);
    if (!layer || !g || layer.childElementCount) return;
    const frag = document.createDocumentFragment();
    for (const st of galaxyStars(g, { detail: true })) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(st.x));
      c.setAttribute('cy', String(st.y));
      c.setAttribute('r', String(st.r));
      c.setAttribute('opacity', String(st.o));
      frag.append(c);
    }
    layer.append(frag);
  }

  function enter(id: string, { focusPanel = true } = {}) {
    const el = galaxyEls.get(id);
    if (!el) return;
    selected = id;
    root.classList.add('is-zoomed');
    wraps.forEach((w, gid) => w.classList.toggle('is-selected', gid === id));
    fillDense(id);
    // fly in, then the chart arrives: dial ticks sweep on, stars burst from the core, results rise
    const chart = wraps.get(id)?.querySelector<SVGGElement>('.chart') ?? null;
    if (!reducedMotion()) {
      primeBurst(chart?.querySelector<SVGGElement>('[data-dense]') ?? null);
      play(chart, 'is-arriving', 2400);
    }
    panels.forEach((p, pid) => (p.hidden = pid !== id));
    panelWrap.hidden = false;
    moveTo(boxFor(el), 900);
    if (focusPanel) panels.get(id)?.focus({ preventScroll: true });
  }

  function leave() {
    if (!selected) return;
    const last = galaxyEls.get(selected);
    selected = null;
    root.classList.remove('is-zoomed');
    wraps.forEach((w) => w.classList.remove('is-selected'));
    panelWrap.hidden = true;
    moveTo({ ...VIEW }, 380);
    last?.focus({ preventScroll: true });
  }

  galaxyEls.forEach((el, id) => {
    el.addEventListener('click', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return; // let the browser open the page
      if (selected === id) return; // inside the galaxy, a second click follows the link
      ev.preventDefault();
      enter(id);
    });
  });

  root.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', leave));
  root.querySelector('[data-bg]')?.addEventListener('click', leave);
  // Escape leaves the galaxy wherever focus is (e.g. after opening /atlas/#ml from a link)
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && selected) leave();
  });

  /* ── opening: the camera pulls in, the sky lights up, each galaxy forms from its core ── */
  const replayBtn = root.querySelector<HTMLButtonElement>('[data-replay]');
  const arts = [...galaxyEls.values()].map((a) => a.querySelector<SVGGElement>('.galaxy-art')!);
  let introTimer = 0;

  function primeIntro() {
    root.querySelectorAll<SVGCircleElement>('.u-star').forEach((c, i) => c.style.setProperty('--k', ((i * 0.618034) % 1).toFixed(3)));
    arts.forEach((a) => primeBurst(a.querySelector<SVGGElement>('.galaxy-art__stars')));
  }

  function endIntro() {
    clearTimeout(introTimer);
    if (!root.classList.contains('is-intro')) return;
    root.classList.remove('is-intro');
    arts.forEach((a) => stop(a, 'is-forming'));
    if (!selected) setView({ ...VIEW });
    if (!reducedMotion()) play(root, 'is-greet', INTRO.greet);
  }

  function skipIntro() {
    if (!root.classList.contains('is-intro')) return;
    cancelAnimationFrame(frame);
    clearTimeout(settle);
    endIntro();
  }

  function playIntro() {
    root.classList.remove('is-intro-wait');
    if (reducedMotion()) return;
    if (selected) leave();
    showList(false);
    primeIntro();
    stop(root, 'is-greet');
    root.classList.remove('is-intro');
    root.getBoundingClientRect();
    root.classList.add('is-intro');
    arts.forEach((a, i) => {
      a.style.setProperty('--d0', `${INTRO.firstGalaxy + i * INTRO.between}ms`);
      play(a, 'is-forming', INTRO.end + 400);
    });
    // start far out and pull in to the whole universe
    const far = 2.6;
    setView({ x: VIEW.w / 2 - (VIEW.w * far) / 2, y: VIEW.h / 2 - (VIEW.h * far) / 2, w: VIEW.w * far, h: VIEW.h * far });
    moveTo({ ...VIEW }, INTRO.dolly, out);
    introTimer = window.setTimeout(endIntro, INTRO.end);
    try {
      sessionStorage.setItem(`oq.intro.${root.dataset.mode}`, '1');
    } catch {
      /* private mode: the opening may play again, which is harmless */
    }
  }

  // any interaction during the opening skips straight to the finished sky
  root.addEventListener('pointerdown', skipIntro);
  root.addEventListener('wheel', skipIntro, { passive: true });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Tab') skipIntro();
  });
  window.addEventListener('oq:motion', () => reducedMotion() && skipIntro());

  if (replayBtn) {
    const syncReplay = () => (replayBtn.hidden = reducedMotion());
    syncReplay();
    window.addEventListener('oq:motion', syncReplay);
    replayBtn.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    replayBtn.addEventListener('click', playIntro);
  }

  /* map / list */
  const viewBtns = root.querySelectorAll<HTMLButtonElement>('[data-view]');
  function showList(list: boolean) {
    viewBtns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.view === 'list') === list)));
    mapEl.hidden = list;
    listEl.hidden = !list;
  }
  viewBtns.forEach((b) => b.addEventListener('click', () => showList(b.dataset.view === 'list')));

  // deep link: /atlas/#ml opens that galaxy
  if (root.dataset.mode === 'full') {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (galaxyEls.has(hash)) enter(hash, { focusPanel: false });
  }

  // play the opening once the map is actually on screen (on phones it sits below the profile)
  if (root.classList.contains('is-intro-wait')) {
    root.dataset.introReady = '1';
    const html = document.documentElement;
    const watch = () => {
      const box = mapEl.getBoundingClientRect();
      const seen = Math.min(box.bottom, innerHeight) - Math.max(box.top, 0);
      if (seen >= box.height * 0.35) return playIntro();
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          playIntro();
        },
        { threshold: 0.35 },
      );
      io.observe(mapEl);
    };
    // after the site's entrance (Splash.astro), the map's opening continues from its dive
    if (html.classList.contains('oq-splash') && html.dataset.splash !== 'done') addEventListener('oq:splash-done', watch, { once: true });
    else watch();
  }
}
