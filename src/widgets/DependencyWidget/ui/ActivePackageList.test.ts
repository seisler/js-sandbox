import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivePackageList from './ActivePackageList.svelte';

const { packageBindingsState } = vi.hoisted(() => ({
  packageBindingsState: {
    packages: [] as { package: string; alias: string }[],
    addPackage: vi.fn(),
    removePackage: vi.fn(),
    updateAlias: vi.fn(),
  },
}));

vi.mock('$shared/model', () => ({ packageBindingsState }));

describe('ActivePackageList', () => {
  beforeEach(() => {
    packageBindingsState.packages = [];
    packageBindingsState.updateAlias.mockClear();
    packageBindingsState.removePackage.mockClear();
  });

  it('renders one item per active binding, showing the package name', () => {
    packageBindingsState.packages = [
      { package: 'lodash', alias: '_' },
      { package: 'zod', alias: 'z' },
    ];

    render(ActivePackageList);

    expect(screen.getByText('lodash')).toBeInTheDocument();
    expect(screen.getByText('zod')).toBeInTheDocument();
  });

  it("renders each binding's alias as the input value", () => {
    packageBindingsState.packages = [{ package: 'lodash', alias: '_' }];

    render(ActivePackageList);

    const input = screen.getByLabelText('as') as HTMLInputElement;
    expect(input.value).toBe('_');
  });

  // US2 — customise alias
  it('commits a new non-empty alias via updateAlias (C8)', async () => {
    packageBindingsState.packages = [{ package: 'lodash', alias: '_' }];

    render(ActivePackageList);
    await fireEvent.input(screen.getByLabelText('as'), { target: { value: 'lodash' } });

    expect(packageBindingsState.updateAlias).toHaveBeenCalledWith('lodash', 'lodash');
  });

  // US4 — inline validation blocks empty aliases
  it('shows an inline error and does not commit when the alias is cleared (C11)', async () => {
    packageBindingsState.packages = [{ package: 'lodash', alias: '_' }];

    render(ActivePackageList);
    const input = screen.getByLabelText('as') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '' } });

    expect(packageBindingsState.updateAlias).not.toHaveBeenCalled();
    expect(screen.getByText('Alias cannot be empty')).toBeInTheDocument();
    expect(input).toHaveClass('c-package-manager__alias-input--invalid');
  });

  // US3 — remove
  it('removes a package when its remove button is clicked (C9)', async () => {
    packageBindingsState.packages = [{ package: 'zod', alias: 'z' }];

    render(ActivePackageList);
    await fireEvent.click(screen.getByRole('button', { name: 'Remove zod' }));

    expect(packageBindingsState.removePackage).toHaveBeenCalledWith('zod');
  });
});
