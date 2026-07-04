import type { PackageBinding } from './PackageBindings.type';

export function addBinding(list: PackageBinding[], binding: PackageBinding): PackageBinding[] {
  if (!binding.package || !binding.alias) {
    throw new Error('PackageBinding requires a non-empty package name and alias');
  }

  if (list.some((existing) => existing.package === binding.package)) {
    return list;
  }

  return [...list, binding];
}

export function removeBinding(list: PackageBinding[], packageName: string): PackageBinding[] {
  if (!list.some((existing) => existing.package === packageName)) {
    throw new Error(`Package "${packageName}" is not in the active list`);
  }

  return list.filter((existing) => existing.package !== packageName);
}

export function updateBindingAlias(list: PackageBinding[], packageName: string, newAlias: string): PackageBinding[] {
  if (!newAlias) {
    throw new Error('alias must be non-empty');
  }

  if (!list.some((existing) => existing.package === packageName)) {
    throw new Error(`Package "${packageName}" is not in the active list`);
  }

  return list.map((existing) => existing.package === packageName ? { ...existing, alias: newAlias } : existing);
}
