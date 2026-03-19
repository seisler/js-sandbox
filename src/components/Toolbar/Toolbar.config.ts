import type { Component } from 'svelte';
import EngineIcon from './icons/EngineIcon.svelte';
import type { MenuItem } from '../ui/Menu/Menu.types'

export enum EToolbarItem {
  toolMenu = 'tool-menu',
}

type ToolbarItem = {
  id: EToolbarItem,
  label: string,
  Icon: Component,
  menuItems: MenuItem[],
}

type ToolbarMenuConfig = {
  [K in EToolbarItem]: ToolbarItem;
}

export const menuConfig: ToolbarMenuConfig = Object.freeze({
  [EToolbarItem.toolMenu]: {
    id: EToolbarItem.toolMenu,
    label: 'Tool menu',
    Icon: EngineIcon,
    menuItems: [
      {
        id: 'theme',
        text: 'Theme',
      },
      {
        id: 'settings',
        text: 'Settings',
      },
      {
        id: 'update-check',
        text: 'Check for updates'
      }
    ]
  }
})