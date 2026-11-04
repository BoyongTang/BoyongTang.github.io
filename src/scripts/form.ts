// Shared motion helpers for galaxies "forming": every star starts near its galaxy's core and flies out.
// Animations are opt-in classes added here, so without JavaScript (or with reduced motion) the final
// picture is simply there.

export const reducedMotion = () =>
  document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;

const SPIN = -1.1; // radians: stars start a little "behind" in the spiral, so the burst reads as a swirl
const cos = Math.cos(SPIN);
const sin = Math.sin(SPIN);

/**
 * Give each star in `layer` its offset back to the core (--dx, --dy) and its distance 0–1 (--k).
 * The centre comes from data-x / data-y / data-r on `layer` or its closest ancestor that has them.
 */
export function primeBurst(layer: SVGElement | null, spread = 0.16) {
  if (!layer || layer.dataset.primed) return;
  const host = layer.closest<SVGElement>('[data-r]');
  if (!host) return;
  const gx = Number(host.dataset.x);
  const gy = Number(host.dataset.y);
  const r = Number(host.dataset.r);
  layer.querySelectorAll<SVGCircleElement>('circle').forEach((el) => {
    const x = Number(el.getAttribute('cx'));
    const y = Number(el.getAttribute('cy'));
    const ux = x - gx;
    const uy = y - gy;
    const sx = gx + (ux * cos - uy * sin) * spread;
    const sy = gy + (ux * sin + uy * cos) * spread;
    el.style.setProperty('--dx', `${(sx - x).toFixed(1)}px`);
    el.style.setProperty('--dy', `${(sy - y).toFixed(1)}px`);
    el.style.setProperty('--k', Math.min(1, Math.hypot(ux, uy) / (r * 1.15)).toFixed(2));
  });
  layer.dataset.primed = '1';
}

const timers = new WeakMap<Element, number>();

/** (Re)start an animation class on `el`, and drop it again after `ms` so the element is left at rest. */
export function play(el: Element | null, cls: string, ms: number) {
  if (!el) return;
  el.classList.remove(cls);
  el.getBoundingClientRect(); // flush styles so the animation restarts
  el.classList.add(cls);
  clearTimeout(timers.get(el));
  timers.set(el, window.setTimeout(() => el.classList.remove(cls), ms));
}

export function stop(el: Element | null, cls: string) {
  if (!el) return;
  clearTimeout(timers.get(el));
  el.classList.remove(cls);
}
