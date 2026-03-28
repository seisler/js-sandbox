import type { editor } from 'monaco-editor'

const THEMES = Object.freeze({
  VS:  'vs',
  VS_DARK: 'vs-dark',
  HC_BLACK: 'hc-black',
  HC_LIGHT: 'hc-light',
});

export default {
  //value: 'import * as R from \'ramda\';' + Array(3).fill('').join('\n'), // Fill predefined number of lines.
  automaticLayout: true, // listen on window resizes for responsiveness.
  language: 'typescript',
  theme: THEMES.HC_BLACK,
  cursorStyle: 'line', // "line" | "block" | "underline" | "line-thin" | "block-outline" | "underline-thin".
  lineNumbers: 'on', // "on" | "off" | "relative" | "interval" | ((lineNumber) => string).
  lineDecorationsWidth: 3,
  lineNumbersMinChars: 3,
  renderLineHighlight: 'none',
  glyphMargin: false, // margin left.
  fontFamily: 'Fira Code, monospace',
  fontSize: 18,
  fontLigatures: true, // enable or disable ligatures.
  scrollbar: {
    alwaysConsumeMouseWheel: false,
    //arrowSize?: number;
    handleMouseWheel: false,
    horizontal: 'hidden', // "auto" | "visible" | "hidden";
    horizontalHasArrows: false,
    //horizontalScrollbarSize?: number;
    //horizontalSliderSize?: number;
    ignoreHorizontalScrollbarInContentHeight: false,
    scrollByPage: true, 
    useShadows: true,
    vertical: 'auto', // "auto" | "visible" | "hidden";
    verticalHasArrows: false,
    //verticalScrollbarSize: number;
    //verticalSliderSize: number;
  },
  mouseMiddleClickAction: "openLink",
  quickSuggestions: {
    comments: true,
    other: true,
    strings: true,
  },
  scrollBeyondLastLine: false, // removes default scroll
  minimap: {
    enabled: false, // disable minimap.
  },
  bracketPairColorization: {
    enabled: true,
  },
  padding: {
    top: 15,
  },
} as editor.IStandaloneEditorConstructionOptions