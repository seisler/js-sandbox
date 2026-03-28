
import type { MenuItem } from '../ui/Menu/Menu.types'
import { EPreferencesSection, preferencesState } from '../Preferences/Preferences.svelte.ts'
export enum EMenubarItem {
  'file' = 'file',
  'go'  = 'go',
  'help' = 'help',
}

interface MenubarItem {
  id: EMenubarItem,
  label: string,
  menuItems: MenuItem[],
}

type MenubarConfig = {
  [K in EMenubarItem]: MenubarItem;
}

export const menuConfig: MenubarConfig = Object.freeze({
  [EMenubarItem.file]: {
    id: EMenubarItem.file,
    label: 'File',
    menuItems: [
      {
        id: 'save',
        label: 'Save file',
        onclick: () => preferencesState.open(EPreferencesSection.landing),
      },
      {
        id: 'save-as',
        label: 'Save file as...',
        onclick: () => preferencesState.open(EPreferencesSection.landing),
      },
      {
        id: 'preferences',
        label: 'Preferences',
        onclick: () => preferencesState.open(EPreferencesSection.landing),
      }
    ]
  },
  [EMenubarItem.go]: {
    id: EMenubarItem.go,
    label: 'Go',
    menuItems: [
      {
        id: 'go-to-definition',
        label: 'Go to definition',
        onclick: () => preferencesState.open(EPreferencesSection.landing),
      },
      {
        id: 'go-to-declaration',
        label: 'Go to declaration',
        onclick: () => preferencesState.open(EPreferencesSection.landing),
      }
    ]
  },
  [EMenubarItem.help]: {
    id: EMenubarItem.help,
    label: 'Help',
    menuItems: [
      {
        id: 'update-check',
        label: 'Check for updates...',
        onclick: () => preferencesState.open(EPreferencesSection.landing),
      },
      {
        id: 'about',
        label: 'About',
        onclick: () => preferencesState.open(EPreferencesSection.landing),
      }
    ]
  },
})