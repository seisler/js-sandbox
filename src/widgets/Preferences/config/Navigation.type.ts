import type { MenuItem } from '$shared/ui/Menu';
import { ENavigationSection } from '$shared/model';

interface NavigationItem {
  id: ENavigationSection,
  label: string,
  menuItems: MenuItem[],
}

export type NavigationConfig = {
  [ENavigationSection.appearance]: NavigationItem;
  [ENavigationSection.texteditor]: NavigationItem;
}