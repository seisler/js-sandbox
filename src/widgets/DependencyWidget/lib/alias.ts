import { PackageBindingSchema } from '$shared/config';

/**
 * Whether an alias is acceptable to commit. Delegates the "non-empty" rule to
 * the shared Zod schema (the source of truth), trimming first so a
 * whitespace-only alias is treated as empty (matching the widget mockup).
 */
export function isAliasValid(alias: string): boolean {
  return PackageBindingSchema.shape.alias.safeParse(alias.trim()).success;
}
