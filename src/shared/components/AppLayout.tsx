import { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Bot,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  Heart,
  Wallet,
  BellRing,
  Tags,
  Users,
  DollarSign,
  CalendarDays,
  MessageCircle,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth-store';

const navItems = [
  { path: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { path: '/activity', label: 'Actividad', icon: ArrowLeftRight },
  { path: '/goals', label: 'Metas', icon: Target },
  { path: '/budgets', label: 'Presupuestos', icon: Wallet },
  { path: '/couple', label: 'Pareja', icon: Heart },
  { path: '/shared-finance', label: 'Shared Fin.', icon: Users },
  { path: '/debts', label: 'Deudas', icon: DollarSign },
  { path: '/calendar', label: 'Calendario', icon: CalendarDays },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/reminders', label: 'Recordatorios', icon: BellRing },
  { path: '/categories', label: 'Categorías', icon: Tags },
  { path: '/ai', label: 'IA', icon: Bot },
  { path: '/profile', label: 'Perfil', icon: User },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/*<a href="#main-content" className="skip-link">Saltar al contenido principal</a>*/}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar (desktop) */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <span className="sidebar__logo-icon">T</span>
            <span className="sidebar__logo-text">Together</span>
          </div>
          <button className="sidebar__close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__link sidebar__link--logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-area">
        {/* Top bar */}
        <header className="topbar">
          <button className="topbar__menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
            <Menu size={22} />
          </button>
          <div className="topbar__spacer" />
          <button className="topbar__icon-btn" onClick={() => navigate('/notifications')} aria-label="Notificaciones">
            <Bell size={20} />
          </button>
          <div className="topbar__user">
            <span className="topbar__user-name">
              {user?.first_name || 'Usuario'}
            </span>
            <div className="topbar__avatar">
              {user?.first_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="main-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            >
              <Icon size={20} />
              <span className="bottom-nav__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
