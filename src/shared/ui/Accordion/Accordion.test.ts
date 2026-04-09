import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Accordion from './Accordion.svelte';

describe('Accordion', () => {
  it('renders the label', () => {
    render(Accordion, { props: { label: 'Appearance' } });
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('renders a button with role menuitem', () => {
    render(Accordion, { props: { label: 'Appearance' } });
    expect(screen.getByRole('menuitem')).toBeInTheDocument();
  });

  it('is collapsed by default', () => {
    render(Accordion, { props: { label: 'Appearance' } });
    expect(screen.getByRole('menuitem')).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands when clicked', async () => {
    render(Accordion, { props: { label: 'Appearance' } });
    await fireEvent.click(screen.getByRole('menuitem'));
    expect(screen.getByRole('menuitem')).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapses again when clicked twice', async () => {
    render(Accordion, { props: { label: 'Appearance' } });
    const button = screen.getByRole('menuitem');
    await fireEvent.click(button);
    await fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
