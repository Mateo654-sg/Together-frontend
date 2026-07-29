import { format as dateFnsFormat, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const CURRENCY_LOCALE: Record<string, string> = {
  COP: 'es-CO',
  USD: 'en-US',
  EUR: 'es-ES',
  GBP: 'en-GB',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  ARS: 'es-AR',
  CLP: 'es-CL',
  PEN: 'es-PE',
};

export function formatCurrency(amount: number, currency = 'COP'): string {
  const locale = CURRENCY_LOCALE[currency] ?? 'es-CO';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null, style: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!dateStr) return '';
  try {
    const date = parseISO(dateStr);
    const formatStr = style === 'short' ? 'dd/MM/yy' : style === 'long' ? 'd \'de\' MMMM \'de\' yyyy' : 'dd/MM/yyyy';
    return dateFnsFormat(date, formatStr, { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: es });
  } catch {
    return dateStr;
  }
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || '?';
}
