import { type NavigationConfig, ENavigationSection } from '../ui/Navigation.type';

export const navigationConfig: NavigationConfig = Object.freeze({
  [ENavigationSection.appearance]: {
    id: ENavigationSection.appearance,
    label: 'Appearance',
    menuItems: [
      {id: 'theme', label: 'Theme', onclick: () => {}}
    ],
  },
  [ENavigationSection.texteditor]: {
    id: ENavigationSection.texteditor,
    label: 'Text Editor',
    menuItems: [
      {id: 'cursor', label: 'Cursor', onclick: () => {}},
      {id: 'fontFamily', label: 'Font Family', onclick: () => {}},
      {id: 'fontSize', label: 'Font Size', onclick: () => {}},
      {id: 'language', label: 'Language', onclick: () => {}},
    ],
  },
});