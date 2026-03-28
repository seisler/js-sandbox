import type { Snippet } from 'svelte'

export type FormFieldProps = {
  id: string,
  children: Snippet,
  error: string,
  label: string,
  subLabel: string,
}