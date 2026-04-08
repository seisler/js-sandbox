import type { MenuItem } from '$shared/ui/Menu/Menu.types';

export type CurrentMenuItem = EMenubarItem | null;

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

export type MenubarConfig = {
  [K in EMenubarItem]: MenubarItem;
}