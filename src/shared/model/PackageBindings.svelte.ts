import type { PackageBindingsState } from './PackageBindings.type';
import { addBinding, removeBinding, updateBindingAlias } from './PackageBindings.transitions';

export function createPackageBindingsState(): PackageBindingsState {
  let packages = $state<PackageBindingsState['packages']>([]);

  return {
    get packages() { return packages; },
    addPackage: (binding) => { packages = addBinding(packages, binding); },
    removePackage: (packageName) => { packages = removeBinding(packages, packageName); },
    updateAlias: (packageName, newAlias) => { packages = updateBindingAlias(packages, packageName, newAlias); },
  };
}

export const packageBindingsState: PackageBindingsState = createPackageBindingsState();
