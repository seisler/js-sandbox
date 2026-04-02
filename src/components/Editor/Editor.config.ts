import type { editor } from 'monaco-editor'

/**
 * Monaco Editor default config, it is used to initialize the editor.
 * User can change some of this values on the editor via Preferences Dialog.
 */
export default {
  automaticLayout: true, // listen on window resizes for responsiveness.
  //language: 'typescript',
  //theme: Theme.HcBlack,
  //cursorStyle: 'line', // "line" | "block" | "underline" | "line-thin" | "block-outline" | "underline-thin".
  lineNumbers: 'on', // "on" | "off" | "relative" | "interval" | ((lineNumber) => string).
  lineDecorationsWidth: 3,
  lineNumbersMinChars: 3,
  renderLineHighlight: 'none',
  glyphMargin: false, // margin left.
  //fontFamily: 'Fira Code, monospace',
  //fontSize: 18,
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