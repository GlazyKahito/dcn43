import { WorksWheelItem } from './types';
import { LAB_MODULES } from '../../data/labModules';

export const PORTFOLIO_PROJECTS: WorksWheelItem[] = LAB_MODULES.map((m) => ({
  id: m.id,
  navLabel: m.navLabel,
  title: m.navLabel,
  category: m.category,
  year: '2026',
  image: m.image,
  href: `#${m.sectionId}`,
  description: m.description,
  badge: m.badge,
}));
