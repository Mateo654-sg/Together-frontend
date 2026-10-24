import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { Card } from '@/shared/components/Card';
import { ErrorState } from '@/shared/components/ErrorState';
import {
  ArrowLeft, Save, Download, Trash2, Smartphone, Monitor,
  LogOut, ChevronLeft, ChevronRight, Bell, BellOff, Sun, Moon, Laptop,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/shared/components/Toast';
import { usersApi } from '@/services/api';
import { requestNotificationPermission, showLocalNotification, notificationsSupported, vibrate } from '@/pwa/device';
import type { SessionHistoryItem } from '@/types/api';

const SESSIONS_PER_PAGE = 4;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sessionsPage, setSessionsPage] = useState(0);

  useEffect(() => {
    usersApi.getSettings()
      .then((settings) => {
        setNotificationsEnabled(settings.notifications_enabled ?? true);
        setTheme(settings.theme || 'dark');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const applyTheme = () => {
      const effective = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
      document.documentElement.setAttribute('data-theme', effective);
    };
    applyTheme();
    if (theme === 'system') {
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const handleSave = async () => {
    setSaving(true);
    setError(false);
    try {
      await Promise.all([
        usersApi.updateMe({ currency: 'COP', language: 'es' }),
        usersApi.updateSettings({ theme, notifications_enabled: notificationsEnabled }),
      ]);
      if (user) setUser({ ...user, currency: 'COP', language: 'es' });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const { data: sessionsData } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: () => usersApi.getSessions(),
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const allSessions = sessionsData?.data ?? [];
  const totalPages = Math.ceil(allSessions.length / SESSIONS_PER_PAGE);
  const pagedSessions = allSessions.slice(
    sessionsPage * SESSIONS_PER_PAGE,
    (sessionsPage + 1) * SESSIONS_PER_PAGE,
  );

  const refreshSessions = () => {
    queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    setSessionsPage(0);
  };

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => usersApi.revokeSession(sessionId),
    onSuccess: () => { refreshSessions(); toast('success', 'Sesión revocada correctamente.'); },
    onError: () => toast('error', 'No se pudo revocar la sesión.'),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => usersApi.revokeAllSessions(),
    onSuccess: () => { refreshSessions(); toast('success', 'Sesiones cerradas en otros dispositivos.'); },
    onError: () => toast('error', 'No se pudo cerrar las demás sesiones.'),
  });

  if (loading) return (
    <div>
      <div className="page-header"><h1 className="page-header__title">Configuración</h1></div>
      <Card hover={false}><div className="skeleton" style={{ height: 200 }} /></Card>
    </div>
  );

  const themeOptions = [
    { key: 'light', label: 'Claro', icon: Sun },
    { key: 'dark', label: 'Oscuro', icon: Moon },
    { key: 'system', label: 'Sistema', icon: Laptop },
  ];

  return (
    <div>
      <div className="page-header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="page-header__actions">
          <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {error && <ErrorState message="Error al guardar configuración" />}

      {/* Apariencia */}
      <Card hover={false} style={{ marginBottom: 'var(--space-4)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 600 }}>
          Apariencia
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {themeOptions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              style={{
                flex: 1, minWidth: 100,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-4) var(--space-3)',
                borderRadius: 'var(--radius-xl)',
                border: theme === key
                  ? '2px solid var(--color-brand-500)'
                  : '2px solid var(--color-border-subtle)',
                background: theme === key ? 'var(--color-brand-dim)' : 'var(--color-bg-elevated)',
                color: theme === key ? 'var(--color-brand-400)' : 'var(--color-text-secondary)',
                cursor: 'pointer', transition: 'all var(--transition-fast)',
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Notificaciones */}
      <Card hover={false} style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Notificaciones</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {notificationsEnabled ? 'Las alertas y recordatorios están activos.' : 'Las notificaciones están desactivadas.'}
            </p>
          </div>
          <button
            onClick={async () => {
              const next = !notificationsEnabled;
              if (next && notificationsSupported()) {
                const permission = await requestNotificationPermission();
                if (permission !== 'granted') {
                  toast('warning', 'Activa el permiso de notificaciones en tu navegador.');
                  return;
                }
              }
              setNotificationsEnabled(next);
            }}
            style={{
              width: 48, height: 26,
              borderRadius: 'var(--radius-full)',
              background: notificationsEnabled ? 'var(--color-brand-500)' : 'var(--color-border-strong)',
              border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'background var(--transition-fast)', flexShrink: 0,
            }}
            role="switch"
            aria-checked={notificationsEnabled}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: notificationsEnabled ? 25 : 3,
              width: 20, height: 20,
              borderRadius: '50%', background: 'white',
              transition: 'left var(--transition-fast)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>

        {notificationsSupported() && notificationsEnabled && (
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={async () => {
              if (Notification.permission !== 'granted') {
                const permission = await requestNotificationPermission();
                if (permission !== 'granted') {
                  toast('warning', 'Activa el permiso de notificaciones en tu navegador.');
                  return;
                }
              }
              vibrate([60, 40, 60]);
              showLocalNotification('Together', {
                body: 'Las notificaciones del dispositivo funcionan correctamente.',
                icon: '/icons/pwa-192x192.png',
                badge: '/icons/pwa-192x192.png',
              });
              toast('success', 'Notificación de prueba enviada.');
            }}
          >
            <Bell size={14} /> Enviar notificación de prueba
          </button>
        )}

        {!notificationsEnabled && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)',
            background: 'var(--color-warning-dim)', color: 'var(--color-warning)',
            fontSize: 'var(--text-sm)',
          }}>
            <BellOff size={14} />
            No recibirás alertas de recordatorios ni presupuestos.
          </div>
        )}
      </Card>

      {/* Datos */}
      <Card hover={false} style={{ marginBottom: 'var(--space-4)' }}>
        <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-base)', fontWeight: 600 }}>Mis datos</h3>
        <button
          className="btn btn--secondary"
          onClick={async () => {
            setExporting(true);
            try {
              const { blob, filename } = await usersApi.exportData();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              a.click();
              URL.revokeObjectURL(url);
            } catch {
              setError(true);
            } finally {
              setExporting(false);
            }
          }}
          disabled={exporting}
        >
          <Download size={16} /> {exporting ? 'Exportando...' : 'Exportar mis datos'}
        </button>
      </Card>

      {/* Sesiones */}
      <Card hover={false} style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Sesiones activas</h3>
            {allSessions.length > 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                {allSessions.length} {allSessions.length === 1 ? 'dispositivo' : 'dispositivos'} registrados
              </p>
            )}
          </div>
          <button
            className="btn btn--danger btn--sm"
            onClick={() => revokeAllMutation.mutate()}
            disabled={revokeAllMutation.isPending || allSessions.length === 0}
          >
            <LogOut size={14} /> Cerrar otras sesiones
          </button>
        </div>

        {allSessions.length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            No hay sesiones registradas.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {pagedSessions.map((session: SessionHistoryItem) => {
                const isMobile = session.device && /mobile|android|iphone|tablet/i.test(session.device);
                return (
                  <div
                    key={session.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-overlay)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: 'var(--color-text-secondary)',
                    }}>
                      {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {session.device || 'Dispositivo desconocido'}
                        {session.is_revoked && (
                          <span style={{
                            fontSize: 'var(--text-xs)', padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-danger-dim)', color: 'var(--color-danger)',
                            fontWeight: 600,
                          }}>Revocada</span>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {session.ip ? `${session.ip} · ` : ''}
                        {new Date(session.created_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    {!session.is_revoked && (
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => revokeSessionMutation.mutate(session.id)}
                        disabled={revokeSessionMutation.isPending}
                        title="Cerrar esta sesión"
                        style={{ color: 'var(--color-danger)', flexShrink: 0 }}
                      >
                        <LogOut size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)',
                borderTop: '1px solid var(--color-border-subtle)',
              }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {sessionsPage + 1} / {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => setSessionsPage(p => Math.max(0, p - 1))}
                    disabled={sessionsPage === 0}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => setSessionsPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={sessionsPage >= totalPages - 1}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Zona de peligro */}
      <Card hover={false}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-danger)', flexShrink: 0,
          }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-danger)' }}>
              Zona de peligro
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Esta acción es permanente e irreversible.
            </p>
          </div>
        </div>
        <button
          className="btn btn--danger btn--sm"
          onClick={() => {
            const password = prompt('Ingresa tu contraseña para confirmar la eliminación de tu cuenta:');
            if (password) {
              usersApi.deleteMe(password).then(() => {
                window.location.href = '/login';
              }).catch(() => {
                setError(true);
              });
            }
          }}
        >
          <Trash2 size={14} /> Eliminar mi cuenta
        </button>
      </Card>
    </div>
  );
}
