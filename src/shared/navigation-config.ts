/**
 * Configuración pura de navegación (sin dependencias de UI).
 * Se puede testear con Node estándar sin transformar JSX.
 */

export interface NavEntry {
  path: string;
  label: string;
}

export const NAV_ITEMS: NavEntry[] = [
  { path: '/dashboard', label: 'Inicio' },
  { path: '/activity', label: 'Actividad' },
  { path: '/transfers', label: 'Transferencias' },
  { path: '/recurring', label: 'Recurrentes' },
  { path: '/goals', label: 'Metas' },
  { path: '/budgets', label: 'Presupuestos' },
  { path: '/couple', label: 'Pareja' },
  { path: '/shared-finance', label: 'Shared Fin.' },
  { path: '/debts', label: 'Deudas' },
  { path: '/calendar', label: 'Calendario' },
  { path: '/chat', label: 'Chat' },
  { path: '/reminders', label: 'Recordatorios' },
  { path: '/categories', label: 'Categorías' },
  { path: '/reports', label: 'Reportes' },
  { path: '/ai', label: 'IA' },
  { path: '/profile', label: 'Perfil' },
];

/**
 * Navegación inferior (mobile).
 * Por diseño solo contiene "Inicio", de forma consistente en iOS y Android.
 * El resto de secciones se accede desde la sidebar/menú.
 */
export const BOTTOM_NAV_ITEMS: NavEntry[] = [
  { path: '/dashboard', label: 'Inicio' },
];
