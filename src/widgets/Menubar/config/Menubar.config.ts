import { preferencesDialogState } from '$features/open-preferences';
import { EMenubarItem, type MenubarConfig } from '../ui/Menubar.type';

export const menuConfig: MenubarConfig = Object.freeze({
  [EMenubarItem.file]: {
    id: EMenubarItem.file,
    label: 'File',
    menuItems: [
      {
        id: 'save',
        label: 'Save file',
        onclick: () => preferencesDialogState.open(),
      },
      {
        id: 'save-as',
        label: 'Save file as...',
        onclick: () => preferencesDialogState.open(),
      },
      {
        id: 'preferences',
        label: 'Preferences',
        onclick: () => preferencesDialogState.open(),
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
        onclick: () => preferencesDialogState.open(),
      },
      {
        id: 'go-to-declaration',
        label: 'Go to declaration',
        onclick: () => preferencesDialogState.open(),
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
        onclick: () => preferencesDialogState.open(),
      },
      {
        id: 'about',
        label: 'About',
        onclick: () => preferencesDialogState.open(),
      }
    ]
  },
});