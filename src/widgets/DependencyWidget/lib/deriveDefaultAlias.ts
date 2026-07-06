/**
 * Derive a readable, valid JS-identifier default alias from an npm package name.
 *
 * Scoped packages drop their scope (`@types/node` → `node`); the remaining name
 * is camel-cased on non-alphanumeric separators (`date-fns` → `dateFns`). The
 * result is only a starting suggestion — the user can always edit it.
 */
export function deriveDefaultAlias(packageName: string): string {
  const unscoped = packageName.includes('/')
    ? packageName.slice(packageName.lastIndexOf('/') + 1)
    : packageName;

  const segments = unscoped.split(/[^a-zA-Z0-9]+/).filter(Boolean);

  return segments
    .map((segment, index) =>
      index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1),
    )
    .join('');
}
