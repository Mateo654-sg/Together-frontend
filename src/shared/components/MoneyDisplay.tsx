import { formatCurrency } from '@/shared/utils/format';

interface MoneyDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'positive' | 'negative' | 'primary' | 'muted';
  currency?: string;
}

export function MoneyDisplay({ amount, size = 'md', color = 'default', currency }: MoneyDisplayProps) {
  const formatted = formatCurrency(amount, currency);
  const colorClass = {
    default: '',
    positive: 'money--positive',
    negative: 'money--negative',
    primary: 'money--primary',
    muted: 'money--muted',
  }[color];

  return (
    <span className={`money money--${size} ${colorClass}`}>
      {formatted}
    </span>
  );
}
