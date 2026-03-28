import type { Component } from 'svelte';
import type { MenuItem } from '../ui/Menu/Menu.types';
import EngineIcon from './icons/EngineIcon.svelte';
import { EPreferencesSection, preferencesState } from '../Preferences/Preferences.svelte.ts';

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