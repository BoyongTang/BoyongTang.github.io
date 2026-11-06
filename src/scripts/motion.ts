// Whether the sky should hold still: the visitor's system setting, or the switch on the page.
export const reducedMotion = () =>
  document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
