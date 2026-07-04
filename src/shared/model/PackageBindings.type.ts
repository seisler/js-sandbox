import type { z } from 'zod';
import type { PackageBindingSchema } from '$shared/config';

export type PackageBinding = z.infer<typeof PackageBindingSchema>;

export interface PackageBindingsState {
  readonly packages: PackageBinding[];
  addPackage(binding: PackageBinding): void;
  removePackage(packageName: string): void;
  updateAlias(packageName: string, newAlias: string): void;
}
