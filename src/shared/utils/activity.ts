export type MovementType = 'expense' | 'income';

export type MovementContext = 'personal' | 'shared';

export interface ActivityItem {
  id: string;
  _type: MovementType;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  category: string;
}

export function getMovementIcon(item: ActivityItem): string {
  if (item.category !== 'Gasto' && item.description.toLowerCase().includes('aporte a meta')) return '💰';
  if (item._type === 'income') return '💼';
  const text = item.description.toLowerCase();
  if (text.includes('comida') || text.includes('pan') || text.includes('restaurant')) return '🍔';
  if (text.includes('mercado') || text.includes('super') || text.includes('walmart')) return '🛒';
  if (text.includes('transporte') || text.includes('uber') || text.includes('taxi')) return '🚗';
  if (text.includes('casa') || text.includes('arriendo') || text.includes('hogar')) return '🏠';
  return '💳';
}

export function getGroupLabel(dateValue: string): string {
  const date = new Date(dateValue);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.floor((startOfToday - startOfDate) / 86_400_000);

  if (dayDiff === 0) return 'Hoy';
  if (dayDiff === 1) return 'Ayer';
  if (dayDiff < 7) return 'Esta semana';
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}
