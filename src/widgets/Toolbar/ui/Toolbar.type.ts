import type { Component } from 'svelte';
import type { MenuItem } from '$shared/ui/Menu';

export enum EToolbarItem {
  toolMenu = 'tool-menu',
}

type ToolbarItem = {
  id: EToolbarItem,
  label: string,
  Icon: Component,
  menuItems: MenuItem[],
}

export type ToolbarMenuConfig = {
  [K in EToolbarItem]: ToolbarItem;
}