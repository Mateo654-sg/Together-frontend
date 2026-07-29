import { formatCurrency, toFiniteNumber } from '@/shared/utils/format';

const COLOR_CLASSES: Record<string, string> = {
  default: '',
  positive: 'money--positive',
  negative: 'money--negative',
  primary: 'money--primary',
  muted: 'money--muted',
};

interface MoneyDisplayProps {
  amount: number | string | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'positive' | 'negative' | 'primary' | 'muted';
  currency?: string;
}

export function MoneyDisplay({ amount, size = 'md', color = 'default', currency }: MoneyDisplayProps) {
  const formatted = formatCurrency(toFiniteNumber(amount), currency);
  const colorClass = COLOR_CLASSES[color];

  return (
    <span className={`money money--${size} ${colorClass}`}>
      {formatted}
    </span>
  );
}
