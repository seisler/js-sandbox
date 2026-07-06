import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PackagePicker from './PackagePicker.svelte';
import type { PackageSearchResult } from '../api/searchPackages';

const { packageBindingsState, searchPackagesMock } = vi.hoisted(() => ({
  packageBindingsState: {
    packages: [] as { package: string; alias: string }[],
    addPackage: vi.fn(),
    removePackage: vi.fn(),
    updateAlias: vi.fn(),
  },
  searchPackagesMock: vi.fn(),
}));

vi.mock('$shared/model', () => ({ packageBindingsState }));
vi.mock('../api/searchPackages', () => ({
  searchPackages: (query: string) => searchPackagesMock(query),
}));

const lodash: PackageSearchResult = {
  name: 'lodash',
  description: 'Lodash modular utilities.',
  version: '4.17.21',
};

function renderOpen(): void {
  render(PackagePicker, { props: { open: true, onclose: vi.fn() } });
}

describe('PackagePicker', () => {
  beforeEach(() => {
    packageBindingsState.packages = [];
    packageBindingsState.addPackage.mockClear();
    searchPackagesMock.mockReset();
  });

  it('shows the idle prompt before the user types (C2)', () => {
    renderOpen();
    expect(screen.getByText('Start typing to search packages')).toBeInTheDocument();
  });

  it('shows a loading indication while a search is in flight (C4)', async () => {
    searchPackagesMock.mockReturnValue(new Promise(() => {})); // never resolves
    renderOpen();

    await fireEvent.input(screen.getByLabelText('Search packages'), { target: { value: 'lod' } });

    await waitFor(() => expect(screen.getByText('Searching…')).toBeInTheDocument());
  });

  it('renders results with description and derived alias hint after debounce (C3)', async () => {
    searchPackagesMock.mockResolvedValue([lodash]);
    renderOpen();

    await fireEvent.input(screen.getByLabelText('Search packages'), { target: { value: 'lod' } });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /lodash/ })).toBeInTheDocument(),
    );
    expect(screen.getByText('lodash')).toBeInTheDocument(); // package name
    expect(screen.getByText('(lodash)')).toBeInTheDocument(); // derived alias hint
    expect(screen.getByText('Lodash modular utilities.')).toBeInTheDocument();
  });

  it('shows a no-match message when the registry returns nothing (C5)', async () => {
    searchPackagesMock.mockResolvedValue([]);
    renderOpen();

    await fireEvent.input(screen.getByLabelText('Search packages'), {
      target: { value: 'zzzznope' },
    });

    await waitFor(() =>
      expect(screen.getByText('No packages match "zzzznope"')).toBeInTheDocument(),
    );
  });

  it('shows an error state when the search fails (C6)', async () => {
    searchPackagesMock.mockRejectedValue('network down');
    renderOpen();

    await fireEvent.input(screen.getByLabelText('Search packages'), { target: { value: 'lod' } });

    await waitFor(() =>
      expect(screen.getByText('Search unavailable — try again')).toBeInTheDocument(),
    );
  });

  it('does not offer an already-active package even if the registry returns it (C10)', async () => {
    packageBindingsState.packages = [{ package: 'lodash', alias: '_' }];
    searchPackagesMock.mockResolvedValue([lodash]);
    renderOpen();

    await fireEvent.input(screen.getByLabelText('Search packages'), { target: { value: 'lod' } });

    await waitFor(() =>
      expect(screen.getByText('No packages match "lod"')).toBeInTheDocument(),
    );
    expect(screen.queryByRole('button', { name: /lodash/ })).not.toBeInTheDocument();
  });

  it('adds the package with a derived alias and closes on selection (C7)', async () => {
    searchPackagesMock.mockResolvedValue([lodash]);
    const onclose = vi.fn();
    render(PackagePicker, { props: { open: true, onclose } });

    await fireEvent.input(screen.getByLabelText('Search packages'), { target: { value: 'lod' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /lodash/ })).toBeInTheDocument(),
    );

    await fireEvent.click(screen.getByRole('button', { name: /lodash/ }));

    expect(packageBindingsState.addPackage).toHaveBeenCalledWith({
      package: 'lodash',
      alias: 'lodash',
    });
    expect(onclose).toHaveBeenCalled();
  });
});
