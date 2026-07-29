import { useAuthStore } from '@/features/auth/store/auth-store';
import { Card } from '@/shared/components/Card';
import { getInitials } from '@/shared/utils/format';
import { Mail, Calendar, MapPin, Phone } from 'lucide-react';
import { formatDate } from '@/shared/utils/format';
import { Link } from 'react-router-dom';
import { Settings, Bell, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Perfil</h1>
      </div>

      <Card hover={false}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 'var(--radius-full)',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
            ) : (
              getInitials(user.first_name, user.last_name)
            )}
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {user.first_name} {user.last_name}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Miembro desde {formatDate(user.created_at, 'long')}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="stat-card" style={{ gap: 'var(--space-3)' }}>
            <Mail size={16} color="var(--color-text-muted)" />
            <div>
              <div className="stat-card__label">Email</div>
              <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>{user.email}</div>
            </div>
          </div>
          {user.phone && (
            <div className="stat-card" style={{ gap: 'var(--space-3)' }}>
              <Phone size={16} color="var(--color-text-muted)" />
              <div>
                <div className="stat-card__label">Teléfono</div>
                <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>{user.phone}</div>
              </div>
            </div>
          )}
          {user.birth_date && (
            <div className="stat-card" style={{ gap: 'var(--space-3)' }}>
              <Calendar size={16} color="var(--color-text-muted)" />
              <div>
                <div className="stat-card__label">Cumpleaños</div>
                <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>{formatDate(user.birth_date, 'long')}</div>
              </div>
            </div>
          )}
          <div className="stat-card" style={{ gap: 'var(--space-3)' }}>
            <MapPin size={16} color="var(--color-text-muted)" />
            <div>
              <div className="stat-card__label">Moneda</div>
              <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>{user.currency}</div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
        <Link to="/settings" className="btn btn--ghost" style={{ justifyContent: 'flex-start', padding: 'var(--space-3)' }}>
          <Settings size={18} /> Configuración
        </Link>
        <Link to="/notifications" className="btn btn--ghost" style={{ justifyContent: 'flex-start', padding: 'var(--space-3)' }}>
          <Bell size={18} /> Notificaciones
        </Link>
        <button className="btn btn--ghost" style={{ justifyContent: 'flex-start', padding: 'var(--space-3)', color: 'var(--color-danger)' }} onClick={logout}>
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
