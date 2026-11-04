// Progressive enhancement for the research atlas. Without this script the map is still a set of
// ordinary links and the list view is still in the page.

interface N {
  id: string;
  type: string;
  code: string;
  title: string;
  short: string;
  topic: string;
  topicLabel: string;
  url: string;
  external: boolean;
  status: string;
  summary: string;
  sample: boolean;
}

interface E {
  source: string;
  target: string;
  relation: string;
  relationLabel: string;
  description: string;
}

const TYPE_LABEL: Record<string, string> = {
  question: 'Question',
  method: 'Method',
  research: 'Research',
  note: 'Field note',
  tool: 'Instrument',
  paper: 'Publication',
};

const OPEN_LABEL: Record<string, string> = {
  question: 'Read the question →',
  method: 'See it in use →',
  research: 'Open dossier →',
  note: 'Read note →',
  tool: 'Open repository ↗',
  paper: 'Open publication →',
};

const VIEW = { w: 1000, h: 700 };
const MIN_W = VIEW.w / 3.2; // most zoomed in
const MAX_W = VIEW.w * 1.25; // most zoomed out

export function initAtlas(root: HTMLElement) {
  const data = JSON.parse(root.querySelector('[data-atlas-data]')!.textContent || '{}') as { nodes: N[]; edges: E[] };
  const svg = root.querySelector<SVGSVGElement>('[data-svg]')!;
  const mapEl = root.querySelector<HTMLElement>('[data-map]')!;
  const listEl = root.querySelector<HTMLElement>('[data-list]')!;
  const preview = root.querySelector<HTMLElement>('[data-preview]')!;
  const full = root.dataset.mode === 'full';

  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const nodeEls = new Map<string, SVGAElement>();
  root.querySelectorAll<SVGAElement>('.node').forEach((el) => nodeEls.set(el.dataset.id!, el));
  const edgeEls = [...root.querySelectorAll<SVGElement>('.edge, .edge-label')];

  const neighbours = (id: string) => {
    const set = new Set([id]);
    for (const e of data.edges) {
      if (e.source === id) set.add(e.target);
      if (e.target === id) set.add(e.source);
    }
    return set;
  };

  let selected: string | null = null;
  let lastFocus: Element | null = null;

  /* ── highlight ───────────────────────────── */

  function highlight(id: string | null) {
    const hot = id ? neighbours(id) : null;
    svg.classList.toggle('has-focus', !!hot);
    nodeEls.forEach((el, nid) => el.classList.toggle('is-hot', !!hot?.has(nid)));
    edgeEls.forEach((el) => {
      const on = !!id && (el.dataset.s === id || el.dataset.t === id);
      el.classList.toggle('is-hot', on);
    });
  }

  const restore = () => highlight(selected);

  /* ── selection & preview card ────────────── */

  const $ = <T extends HTMLElement>(sel: string) => preview.querySelector<T>(sel)!;

  function select(id: string | null, { focusCard = false } = {}) {
    if (selected) nodeEls.get(selected)?.classList.remove('is-selected');
    selected = id;
    highlight(id);
    if (!id) {
      preview.hidden = true;
      return;
    }
    const n = byId.get(id)!;
    nodeEls.get(id)?.classList.add('is-selected');

    $('[data-p-code]').textContent = n.code;
    $('[data-p-title]').textContent = n.title;
    $('[data-p-type]').textContent = TYPE_LABEL[n.type] ?? n.type;
    const st = $('[data-p-status]');
    st.textContent = n.status.replace(/_/g, ' ').toUpperCase();
    st.className = `status status--${n.status}`;
    $('[data-p-sample]').hidden = !n.sample;
    $('[data-p-summary]').textContent = n.summary;

    const rel = data.edges.filter((e) => e.source === id || e.target === id);
    $('[data-p-count]').textContent = String(rel.length).padStart(2, '0');
    const ul = $('[data-p-rel]');
    ul.replaceChildren(
      ...rel.map((e) => {
        const out = e.source === id;
        const other = byId.get(out ? e.target : e.source)!;
        const li = document.createElement('li');
        const em = document.createElement('em');
        em.textContent = out ? `${e.relationLabel} →` : `← ${e.relationLabel}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = `${other.code} ${other.short}`;
        btn.addEventListener('click', () => select(other.id, { focusCard: true }));
        btn.addEventListener('mouseenter', () => highlightEdge(e));
        btn.addEventListener('mouseleave', restore);
        const small = document.createElement('small');
        small.textContent = e.description;
        li.append(em, ' ', btn, small);
        return li;
      }),
    );

    const open = $<HTMLAnchorElement>('[data-p-open]');
    open.href = n.url;
    open.textContent = OPEN_LABEL[n.type] ?? 'Open →';
    if (n.external) {
      open.target = '_blank';
      open.rel = 'noopener';
    } else {
      open.removeAttribute('target');
      open.removeAttribute('rel');
    }

    preview.hidden = false;
    if (focusCard) preview.focus({ preventScroll: true });
  }

  function highlightEdge(e: E) {
    svg.classList.add('has-focus');
    nodeEls.forEach((el, nid) => el.classList.toggle('is-hot', nid === e.source || nid === e.target));
    edgeEls.forEach((el) => el.classList.toggle('is-hot', el.dataset.s === e.source && el.dataset.t === e.target));
  }

  nodeEls.forEach((el, id) => {
    el.addEventListener('mouseenter', () => highlight(id));
    el.addEventListener('mouseleave', restore);
    el.addEventListener('focus', () => highlight(id));
    el.addEventListener('blur', restore);
    el.addEventListener('click', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return; // let the browser open it
      if (moved) {
        ev.preventDefault();
        return;
      }
      if (selected === id) return; // second activation follows the link
      ev.preventDefault();
      lastFocus = el;
      select(id);
    });
    el.addEventListener('keydown', (ev) => {
      if (ev.key === ' ') {
        ev.preventDefault();
        lastFocus = el;
        select(id, { focusCard: true });
      }
    });
  });

  root.querySelector('[data-close]')?.addEventListener('click', () => {
    select(null);
    (lastFocus as HTMLElement | null)?.focus?.();
  });

  root.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && selected) {
      select(null);
      (lastFocus as HTMLElement | null)?.focus?.();
    }
  });

  /* ── text size stays constant on screen ──── */

  let vb = { x: 0, y: 0, w: VIEW.w, h: VIEW.h };

  function updateScale() {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const k = Math.max(vb.w / r.width, vb.h / r.height);
    root.style.setProperty('--k', k.toFixed(3));
    // drawn small: hide secondary labels so the named points stay readable
    root.classList.toggle('is-dense', k > 1.55);
  }

  function applyView() {
    svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
    updateScale();
  }

  new ResizeObserver(updateScale).observe(svg);
  updateScale();

  /* ── zoom & pan (no scroll hijacking) ────── */

  function zoomAt(factor: number, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) {
    const w = Math.min(MAX_W, Math.max(MIN_W, vb.w / factor));
    const f = w / vb.w;
    const h = vb.h * f;
    vb = { x: cx - (cx - vb.x) * f, y: cy - (cy - vb.y) * f, w, h };
    clamp();
    applyView();
  }

  function clamp() {
    const padX = vb.w * 0.6;
    const padY = vb.h * 0.6;
    vb.x = Math.min(VIEW.w - vb.w + padX, Math.max(-padX, vb.x));
    vb.y = Math.min(VIEW.h - vb.h + padY, Math.max(-padY, vb.y));
  }

  root.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      const z = b.dataset.zoom;
      if (z === 'in') zoomAt(1.4);
      else if (z === 'out') zoomAt(1 / 1.4);
      else {
        vb = { x: 0, y: 0, w: VIEW.w, h: VIEW.h };
        applyView();
        select(null);
      }
    }),
  );

  // trackpad pinch arrives as ctrl+wheel; plain wheel keeps scrolling the page
  svg.addEventListener(
    'wheel',
    (ev) => {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      const p = toSvg(ev.clientX, ev.clientY);
      zoomAt(Math.exp(-ev.deltaY * 0.01), p.x, p.y);
    },
    { passive: false },
  );

  function toSvg(clientX: number, clientY: number) {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  }

  const pointers = new Map<number, { x: number; y: number }>();
  let moved = false;
  let start: { x: number; y: number; vb: typeof vb } | null = null;
  let pinch: { d: number; w: number } | null = null;

  svg.addEventListener('pointerdown', (ev) => {
    const canPan = full || ev.pointerType === 'mouse';
    if (!canPan) return;
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    moved = false;
    if (pointers.size === 1) {
      start = { x: ev.clientX, y: ev.clientY, vb: { ...vb } };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), w: vb.w };
    }
  });

  svg.addEventListener('pointermove', (ev) => {
    if (!pointers.has(ev.pointerId)) return;
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const c = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
      zoomAt(vb.w / (pinch.w / (d / pinch.d)), c.x, c.y);
      moved = true;
      return;
    }
    if (!start) return;
    const dx = ev.clientX - start.x;
    const dy = ev.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    if (!moved) {
      moved = true;
      svg.setPointerCapture(ev.pointerId);
      svg.classList.add('is-dragging');
    }
    const r = svg.getBoundingClientRect();
    const k = Math.max(start.vb.w / r.width, start.vb.h / r.height);
    vb = { ...start.vb, x: start.vb.x - dx * k, y: start.vb.y - dy * k };
    clamp();
    applyView();
  });

  const end = (ev: PointerEvent) => {
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      start = null;
      svg.classList.remove('is-dragging');
      // `moved` is read by the click that may follow, then cleared
      setTimeout(() => (moved = false), 0);
    }
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  // clicking empty sky clears the selection
  root.querySelector('[data-bg]')?.addEventListener('click', () => {
    if (!moved) select(null);
  });

  /* ── map / list ──────────────────────────── */

  const viewBtns = root.querySelectorAll<HTMLButtonElement>('[data-view]');
  function setView(list: boolean) {
    viewBtns.forEach((x) => x.setAttribute('aria-pressed', String((x.dataset.view === 'list') === list)));
    mapEl.hidden = list;
    listEl.hidden = !list;
    if (!list) updateScale();
  }
  viewBtns.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view === 'list')));

  // phones read the list first; the map stays one tap away
  if (full && !location.hash && matchMedia('(max-width: 767px)').matches) setView(true);

  /* ── search & topic filter (full atlas) ──── */

  const search = root.querySelector<HTMLInputElement>('[data-search]');
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-topic].chip')];
  const count = root.querySelector<HTMLElement>('[data-count]');
  const empty = root.querySelector<HTMLElement>('[data-empty]');

  function filter() {
    const q = (search?.value ?? '').trim().toLowerCase();
    const topicsOn = chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.topic);
    const match = (n: N) =>
      (!topicsOn.length || topicsOn.includes(n.topic)) &&
      (!q || `${n.code} ${n.title} ${n.summary} ${n.topicLabel} ${TYPE_LABEL[n.type]}`.toLowerCase().includes(q));
    const visible = new Set(data.nodes.filter(match).map((n) => n.id));
    nodeEls.forEach((el, id) => el.classList.toggle('is-filtered', !visible.has(id)));
    root.querySelectorAll<SVGElement>('.edge').forEach((el) =>
      el.classList.toggle('is-filtered', !(visible.has(el.dataset.s!) && visible.has(el.dataset.t!))),
    );
    root.querySelectorAll<HTMLElement>('[data-item]').forEach((li) => (li.hidden = !visible.has(li.dataset.item!)));
    root.querySelectorAll<HTMLElement>('[data-group]').forEach((g) => (g.hidden = !g.querySelector('[data-item]:not([hidden])')));
    if (count) count.textContent = `${visible.size} of ${data.nodes.length} signals`;
    if (empty) empty.hidden = visible.size > 0;
    if (selected && !visible.has(selected)) select(null);
  }

  search?.addEventListener('input', filter);
  chips.forEach((c) =>
    c.addEventListener('click', () => {
      c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
      filter();
    }),
  );
  root.querySelector('[data-clear]')?.addEventListener('click', () => {
    if (search) search.value = '';
    chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    filter();
  });

  // deep link: /atlas/#r-al selects a node
  const hash = decodeURIComponent(location.hash.slice(1));
  if (full && byId.has(hash)) select(hash);
}
