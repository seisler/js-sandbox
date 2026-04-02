import type { HTMLButtonAttributes } from 'svelte/elements'
import type { Snippet } from 'svelte';

export type Button = {
  id?: string,
  role?: string,
  children: Snippet,
  // Only buttons from a menu should have tabindex. Button's tabindex default is 0.
  tabindex?: number,
  variant?: 'normal' | 'ghost',
  align?: 'start' | 'center' | 'end',
  class?: string,
}

export type ButtonProps = Button 
  & Omit<HTMLButtonAttributes, 'form' | 'role' | 'type' | 'tabindex' | 'id'> 