export const enum Theme {
  Vs = 'vs',
  VsDark ='vs-dark',
  HcBlack ='hc-black',
  HcLight ='hc-light',
}

export const enum FontFamily {
  FiraCode = 'Fira Code',
  JetbrainsMono = 'Jetbrains Mono',
  SourceCodePro = 'Source Code Pro',
}

export const enum Cursor {
  Block = 'block',
  Line = 'line',
  Underline = 'underline',
}

export const enum Language {
  Javascript = 'javascript',
  Typescript = 'typescript',
}

export type UserEditorPreferencesState = {
  fontFamily: FontFamily,
  fontSize: number,
  theme: Theme,
  cursor: Cursor,
  language: Language,
}