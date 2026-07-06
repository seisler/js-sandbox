import '@testing-library/jest-dom/vitest';

// jsdom does not support the Web Animations API used by Svelte transitions
Element.prototype.animate = () => ({
  cancel: () => {},
  finish: () => {},
  finished: Promise.resolve(),
  onfinish: null,
  oncancel: null,
}) as unknown as Animation;

// jsdom does not implement the native <dialog> modal methods
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};
