export interface WorksWheelItem {
  id: string;
  navLabel?: string;
  title: string;
  category: string;
  year?: string;
  image: string;
  href?: string;
  description: string;
  badge?: string;
}

export interface WorksWheelProps {
  items: WorksWheelItem[];
  label?: string;
  sublabel?: string;
  action?: string;
  className?: string;
  onEnterModule?: (moduleId: string) => void;
  selectedModuleId?: string;
}
