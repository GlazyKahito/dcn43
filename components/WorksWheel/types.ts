export interface WorksWheelItem {
  id: string;
  title: string;
  category: string;
  year: string;
  image: string;
  href: string;
  description: string;
  badge?: string;
}

export interface WorksWheelProps {
  items: WorksWheelItem[];
  label?: string;
  sublabel?: string;
  action?: string;
  className?: string;
  onSelectProject?: (item: WorksWheelItem, index: number) => void;
}
