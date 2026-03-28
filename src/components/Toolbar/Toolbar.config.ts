import EngineIcon from './icons/EngineIcon.svelte';
import { preferencesState } from '$components/Preferences/Preferences.svelte.ts';
import { EToolbarItem, type ToolbarMenuConfig } from './Toolbar.type.ts';
import { EPreferencesSection } from '$components/Preferences/Preferences.type.ts';

export const menuConfig: ToolbarMenuConfig = Object.freeze({
  [EToolbarItem.toolMenu]: {
    id: EToolbarItem.toolMenu,
    label: 'Tool menu',
    Icon: EngineIcon,
    menuItems: [
      {
        id: 'theme',
        label: 'Theme',
        onclick: () => preferencesState.open(EPreferencesSection.appearance),
      },
      {
        id: 'settings',
        label: 'Settings',
        onclick: () => preferencesState.open(EPreferencesSection.settings),
      },
      {
        id: 'update-check',
        label: 'Check for updates',
        onclick: () => console.log('click on check updates on toolbar')
      }
    ]
  }
})