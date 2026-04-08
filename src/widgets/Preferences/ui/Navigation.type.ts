import type { MenuItem } from '$shared/ui/Menu/Menu.types';

export enum ENavigationSection {
  appearance = 'appearance',
  texteditor = 'texteditor',
}

interface NavigationItem {
  id: ENavigationSection,
  label: string,
  menuItems: MenuItem[],
}

export type NavigationConfig = {
  [K in ENavigationSection]: NavigationItem;
}