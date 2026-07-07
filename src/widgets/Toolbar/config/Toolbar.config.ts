import { preferencesDialogState } from '$features/open-preferences';
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
        onclick: () => preferencesDialogState.open(),
      },
      {
        id: 'settings',
        label: 'Settings',
        onclick: () => preferencesDialogState.open(),
      },
      {
        id: 'update-check',
        label: 'Check for updates',
        onclick: () => {}
      }
    ]
  }
});