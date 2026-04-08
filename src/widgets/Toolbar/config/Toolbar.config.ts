import { EPreferencesSection, preferencesState } from '$shared/model';
import { Engine } from '$shared/ui/icons';
import { EToolbarItem, type ToolbarMenuConfig } from '../ui/Toolbar.type';

export const menuConfig: ToolbarMenuConfig = Object.freeze({
  [EToolbarItem.toolMenu]: {
    id: EToolbarItem.toolMenu,
    label: 'Tool menu',
    Icon: Engine,
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