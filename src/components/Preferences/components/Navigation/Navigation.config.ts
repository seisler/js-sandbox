import type { MenuItem } from '../../../ui/Menu/Menu.types';

export enum ENavigationSection {
  apearance = 'apearance',
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
  [ENavigationSection.apearance]: {
    id: ENavigationSection.apearance,
    label: 'Apearance',
    menuItems: [
      {id: 'theme', label: 'Theme', onclick: () => console.log('click on Apearance -> Theme item')}
    ],
  },
  [ENavigationSection.texteditor]: {
    id: ENavigationSection.texteditor,
    label: 'Text Editor',
    menuItems: [
      {id: 'cursor', label: 'Cursor', onclick: () => console.log('click on Apearance -> Cursor item')},
      {id: 'fontFamily', label: 'Font Family', onclick: () => console.log('click on Apearance -> Font Family item')},
      {id: 'fontSize', label: 'Font Size', onclick: () => console.log('click on Apearance -> Font Size item')},
      {id: 'language', label: 'Language', onclick: () => console.log('click on Apearance -> Font Size item')},
    ],
  },
})