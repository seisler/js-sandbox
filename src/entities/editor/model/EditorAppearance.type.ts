export enum Theme {
  Vs = 'vs',
  VsDark ='vs-dark',
  HcBlack ='hc-black',
  HcLight ='hc-light',
}

export enum FontFamily {
  FiraCode = 'Fira Code',
  JetbrainsMono = 'Jetbrains Mono',
  SourceCodePro = 'Source Code Pro',
}

export enum Cursor {
  Block = 'block',
  Line = 'line',
  Underline = 'underline',
}

export enum Language {
  Javascript = 'javascript',
  Typescript = 'typescript',
}

export type UserEditorAppearanceState = {
  fontFamily: FontFamily,
  fontSize: number,
  theme: Theme,
  cursor: Cursor,
  language: Language,
}