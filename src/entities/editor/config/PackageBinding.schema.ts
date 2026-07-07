import { z } from 'zod';

export const PackageBindingSchema = z.object({
  package: z.string().min(1),
  alias: z.string().min(1),
});

export const DEFAULT_ALIASES = {
  lodash: '_',
  'date-fns': 'dateFns',
  zod: 'z',
} as const;
