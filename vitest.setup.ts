import '@testing-library/jest-dom/vitest';

// jsdom does not support the Web Animations API used by Svelte transitions
Element.prototype.animate = () => ({
  cancel: () => {},
  finish: () => {},
  finished: Promise.resolve(),
  onfinish: null,
  oncancel: null,
}) as unknown as Animation;
