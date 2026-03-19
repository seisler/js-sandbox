
import type { MenuItem } from '../ui/Menu/Menu.types'

export enum EMenubarItem {
  'files' = 'files',
  'go'  = 'go',
  'help' = 'help',
}

interface MenubarItem {
  id: EMenubarItem,
  text: string,
  menuItems: MenuItem[],
}

type MenubarConfig = {
  [K in EMenubarItem]: MenubarItem;
}

export const menuConfig: MenubarConfig = Object.freeze({
  [EMenubarItem.files]: {
    id: EMenubarItem.files,
    text: 'Files',
    menuItems: [
      {
        id: 'save',
        text: 'Save file',
      },
      {
        id: 'save-as',
        text: 'Save file as...',
      }
    ]
  },
  [EMenubarItem.go]: {
    id: EMenubarItem.go,
    text: 'Go',
    menuItems: [
      {
        id: 'go-to-definition',
        text: 'Go to definition', 
      },
      {
        id: 'go-to-declaration',
        text: 'Go to declaration',
      }
    ]
  },
  [EMenubarItem.help]: {
    id: EMenubarItem.help,
    text: 'Help',
    menuItems: [
      {
        id: 'update-check',
        text: 'Check for updates...',
      },
      {
        id: 'about',
        text: 'About',
      }
    ]
  },
})