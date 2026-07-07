import { z } from 'zod';

export const EditorPreferencesSchema = z.object({
  cursor: z.enum(['line', 'block', 'underline']),
  fontFamily: z.enum([
    'Fira Code',
    'Jetbrains Mono',
    'Source Code Pro',
  ]),
  fontSize: z.number()
    .min(9, 'Font is too small, min size allowed 9px')
    .max(20, 'Font is too large, max size allowed 20px')  
  ,
  theme: z.enum(['vs', 'vs-dark', 'hc-black', 'hc-light']),
  language: z.enum(['javascript', 'typescript'])
});