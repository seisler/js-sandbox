import EngineIcon from '../ui/EngineIcon.svelte';
import { preferencesState, EPreferencesSection } from '$features/Preferences';
import { EToolbarItem, type ToolbarMenuConfig } from '../model/Toolbar.type';

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