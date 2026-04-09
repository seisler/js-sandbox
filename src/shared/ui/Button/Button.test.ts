import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button.svelte';

describe('Button', () => {
  it('renders a button element', () => {
    render(Button);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has type="button" by default', () => {
    render(Button);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('applies normal variant class by default', () => {
    render(Button);
    expect(screen.getByRole('button')).toHaveClass('normal');
  });

  it('applies ghost variant class when variant is ghost', () => {
    render(Button, { props: { variant: 'ghost' } });
    expect(screen.getByRole('button')).toHaveClass('ghost');
  });

  it('applies align-center class by default', () => {
    render(Button);
    expect(screen.getByRole('button')).toHaveClass('align-center');
  });

  it('applies align-start class when align is start', () => {
    render(Button, { props: { align: 'start' } });
    expect(screen.getByRole('button')).toHaveClass('align-start');
  });

  it('applies align-end class when align is end', () => {
    render(Button, { props: { align: 'end' } });
    expect(screen.getByRole('button')).toHaveClass('align-end');
  });

  it('forwards id prop', () => {
    render(Button, { props: { id: 'my-button' } });
    expect(screen.getByRole('button')).toHaveAttribute('id', 'my-button');
  });

  it('forwards aria-expanded prop', () => {
    render(Button, { props: { 'aria-expanded': true } });
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('forwards additional class via class prop', () => {
    render(Button, { props: { class: 'my-custom-class' } });
    expect(screen.getByRole('button')).toHaveClass('my-custom-class');
  });

  it('calls onclick when clicked', async () => {
    const onclick = vi.fn();
    render(Button, { props: { onclick } });
    await fireEvent.click(screen.getByRole('button'));
    expect(onclick).toHaveBeenCalledOnce();
  });
});
