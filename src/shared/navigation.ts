import { LayoutDashboard, ArrowLeftRight, Target, Bot, User, Heart, Wallet, BellRing, Tags, Users, DollarSign, CalendarDays, MessageCircle, BarChart3, Repeat, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from './navigation-config';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const ICONS: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/activity': ArrowLeftRight,
  '/transfers': Repeat,
  '/recurring': RefreshCw,
  '/goals': Target,
  '/budgets': Wallet,
  '/couple': Heart,
  '/shared-finance': Users,
  '/debts': DollarSign,
  '/calendar': CalendarDays,
  '/chat': MessageCircle,
  '/reminders': BellRing,
  '/categories': Tags,
  '/reports': BarChart3,
  '/ai': Bot,
  '/profile': User,
};

/** Navegación completa (sidebar / menú). */
export const navItems: NavItem[] = NAV_ITEMS.map((item) => ({
  ...item,
  icon: ICONS[item.path] ?? User,
}));

/** Navegación inferior (mobile): solo "Inicio". */
export const bottomNavItems: NavItem[] = BOTTOM_NAV_ITEMS.map((item) => ({
  ...item,
  icon: ICONS[item.path] ?? User,
}));
