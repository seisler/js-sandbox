import { z } from 'zod';

export const EditorPreferencesSchema = z.object({
  cursor: z.enum(['line', 'block', 'underline']),
  fontFamily: z.enum([
    'fira-code',
    'jetbrains-mono',
    'source-code-pro',
  ]),
  fontSize: z.number()
    .min(9, 'Font is too small, min size allowed 9px')
    .max(20, 'Font is too large, max size allowed 20px')  
  ,
  theme: z.enum(['vs', 'vs-dark', 'hc-black', 'hc-light']),
  language: z.enum(['javascript', 'typescript'])
})

export type EditorSettings = z.infer<typeof EditorPreferencesSchema>;