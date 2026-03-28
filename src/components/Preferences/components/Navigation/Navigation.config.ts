import type { MenuItem } from '../../../ui/Menu/Menu.types';

export enum ENavigationSection {
  appearance = 'appearance',
  texteditor = 'texteditor',
}

interface NavigationItem {
  id: ENavigationSection,
  label: string,
  menuItems: MenuItem[],
}

type NavigationConfig = {
  [K in ENavigationSection]: NavigationItem;
}

export const navigationConfig: NavigationConfig = Object.freeze({
  [ENavigationSection.appearance]: {
    id: ENavigationSection.appearance,
    label: 'Appearance',
    menuItems: [
      {id: 'theme', label: 'Theme', onclick: () => console.log('click on Appearance -> Theme item')}
    ],
  },
  [ENavigationSection.texteditor]: {
    id: ENavigationSection.texteditor,
    label: 'Text Editor',
    menuItems: [
      {id: 'cursor', label: 'Cursor', onclick: () => console.log('click on Text Editor -> Cursor item')},
      {id: 'fontFamily', label: 'Font Family', onclick: () => console.log('click on Text Editor -> Font Family item')},
      {id: 'fontSize', label: 'Font Size', onclick: () => console.log('click on Text Editor -> Font Size item')},
      {id: 'language', label: 'Language', onclick: () => console.log('click on Text Editor -> Language item')},
    ],
  },
})