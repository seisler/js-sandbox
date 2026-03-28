import { type NavigationConfig, ENavigationSection } from './Navigation.type'

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