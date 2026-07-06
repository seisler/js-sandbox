/**
 * Wrap `fn` so that rapid successive calls collapse into a single trailing
 * invocation, fired `delayMs` after the last call, with that call's arguments.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Args): void => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
