import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DependencyWidget from './DependencyWidget.svelte';

const { packageBindingsState, editorState, searchPackagesMock } = vi.hoisted(() => ({
  packageBindingsState: {
    packages: [] as { package: string; alias: string }[],
    addPackage: vi.fn(),
    removePackage: vi.fn(),
    updateAlias: vi.fn(),
  },
  editorState: { code: '' },
  searchPackagesMock: vi.fn().mockResolvedValue([]),
}));

vi.mock('$shared/model', () => ({ packageBindingsState, editorState }));
vi.mock('../api/searchPackages', () => ({
  searchPackages: (query: string) => searchPackagesMock(query),
}));

describe('DependencyWidget', () => {
  beforeEach(() => {
    packageBindingsState.packages = [];
  });

  it('shows the empty state when there are no active packages (C1)', () => {
    render(DependencyWidget);
    expect(screen.getByText('No packages added yet')).toBeInTheDocument();
  });

  it('does not show the empty state when packages are active', () => {
    packageBindingsState.packages = [{ package: 'lodash', alias: '_' }];
    render(DependencyWidget);
    expect(screen.queryByText('No packages added yet')).not.toBeInTheDocument();
  });

  it('renders the add-package trigger', () => {
    render(DependencyWidget);
    expect(screen.getByRole('button', { name: /add package/i })).toBeInTheDocument();
  });

  it('opens the picker dialog when the trigger is clicked', async () => {
    render(DependencyWidget);
    await fireEvent.click(screen.getByRole('button', { name: /add package/i }));
    expect(screen.getByRole('heading', { name: 'Add package' })).toBeInTheDocument();
  });

  // US6 — active packages are independent of editor code changes
  it('leaves the active package list unchanged when editor code changes', async () => {
    packageBindingsState.packages = [
      { package: 'lodash', alias: '_' },
      { package: 'zod', alias: 'z' },
    ];
    render(DependencyWidget);

    editorState.code = 'console.log("edited")';
    await Promise.resolve();

    expect(screen.getByText('lodash')).toBeInTheDocument();
    expect(screen.getByText('zod')).toBeInTheDocument();
    expect(screen.queryByText('No packages added yet')).not.toBeInTheDocument();
  });
});
