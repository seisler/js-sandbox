import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Menu from './Menu.svelte';

const defaultProps = {
  id: 'test-menu',
  ariaLabel: 'Test menu',
  class: '',
  items: [
    { id: 'item-1', label: 'Item 1', onclick: vi.fn() },
    { id: 'item-2', label: 'Item 2', onclick: vi.fn() },
  ],
  onfocusout: vi.fn(),
  domRef: undefined,
};

describe('Menu', () => {
  it('renders a menu element', () => {
    render(Menu, { props: defaultProps });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('renders all items', () => {
    render(Menu, { props: defaultProps });
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders items as menuitem buttons', () => {
    render(Menu, { props: defaultProps });
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(2);
  });

  it('sets aria-label on the menu', () => {
    render(Menu, { props: defaultProps });
    expect(screen.getByRole('menu')).toHaveAttribute('aria-label', 'Test menu');
  });

  it('sets id on the menu', () => {
    render(Menu, { props: defaultProps });
    expect(screen.getByRole('menu')).toHaveAttribute('id', 'test-menu');
  });

  it('calls onclick when an item is clicked', async () => {
    const onclick = vi.fn();
    render(Menu, {
      props: {
        ...defaultProps,
        items: [{ id: 'item-1', label: 'Item 1', onclick }],
      },
    });
    await fireEvent.click(screen.getByText('Item 1'));
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('calls onfocusout when focus leaves the menu', async () => {
    const onfocusout = vi.fn();
    render(Menu, { props: { ...defaultProps, onfocusout } });
    await fireEvent.focusOut(screen.getByRole('menu'));
    expect(onfocusout).toHaveBeenCalledOnce();
  });
});
