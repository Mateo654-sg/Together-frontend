import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { Card } from '@/shared/components/Card';
import { ErrorState } from '@/shared/components/ErrorState';
import { ArrowLeft, Save, Download, Trash2, Smartphone, Monitor, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/shared/components/Toast';
import { usersApi } from '@/services/api';
import type { SessionHistoryItem } from '@/types/api';

const currencies = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'CLP', 'PEN', 'BRL'];
const languages = ['es', 'en'];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('COP');
  const [language, setLanguage] = useState('es');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setCurrency(user?.currency || 'COP');
    setLanguage(user?.language || 'es');
    usersApi.getSettings()
      .then((settings) => {
        setNotificationsEnabled(settings.notifications_enabled ?? true);
        setTheme(settings.theme || 'light');
      })
      .catch(() => {
        // La configuración podría no existir aún; usamos defaults.
      })
      .finally(() => setLoading(false));
  }, [user]);

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
        usersApi.updateMe({ currency, language }),
        usersApi.updateSettings({ theme, notifications_enabled: notificationsEnabled }),
      ]);
      if (user) setUser({ ...user, currency, language });
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

  const refreshSessions = () => queryClient.invalidateQueries({ queryKey: ['user-sessions'] });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => usersApi.revokeSession(sessionId),
    onSuccess: () => {
      refreshSessions();
      toast('success', 'Sesión revocada correctamente.');
    },
    onError: () => toast('error', 'No se pudo revocar la sesión.'),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => usersApi.revokeAllSessions(),
    onSuccess: () => {
      refreshSessions();
      toast('success', 'Sesión cerrada en los demás dispositivos.');
    },
    onError: () => toast('error', 'No se pudo cerrar las demás sesiones.'),
  });

  if (loading) return (
    <div>
      <div className="dashboard-header"><h1>Configuración</h1></div>
      <Card hover={false}><div className="skeleton" style={{ height: 200 }} /></Card>
    </div>
  );

  return (
    <div>
      <div className="dashboard-header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>
        <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {error && <ErrorState message="Error al guardar configuración" />}

      <Card hover={false}>
        <div className="form-group">
          <label className="form-label">Moneda</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {currencies.map((c) => (
              <button
                key={c}
                className={`btn btn--sm ${currency === c ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setCurrency(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Idioma</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {languages.map((l) => (
              <button
                key={l}
                className={`btn btn--sm ${language === l ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setLanguage(l)}
              >
                {l === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tema</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['light', 'dark', 'system'].map((t) => (
              <button
                key={t}
                className={`btn btn--sm ${theme === t ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setTheme(t)}
              >
                {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Sistema'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
            />
            Notificaciones activadas
          </label>
        </div>
      </Card>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <h3 style={{ marginBottom: 'var(--space-3)' }}>Datos</h3>
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

        <hr style={{ margin: 'var(--space-4) 0', border: 'none', borderTop: '1px solid var(--color-border-subtle)' }} />

        <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-danger)' }}>Zona de peligro</h3>
        <button
          className="btn btn--danger"
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
          <Trash2 size={16} /> Eliminar mi cuenta
        </button>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <h3>Sesiones</h3>
          <button
            className="button button--ghost"
            onClick={() => revokeAllMutation.mutate()}
            disabled={revokeAllMutation.isPending || (sessionsData?.data ?? []).length === 0}
          >
            <LogOut size={14} /> Cerrar en otros dispositivos
          </button>
        </div>
        {(sessionsData?.data ?? []).length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No hay sesiones registradas.</p>
        ) : (
          <div className="activity-list">
            {(sessionsData?.data ?? []).map((session: SessionHistoryItem) => (
              <div key={session.id} className="activity-item">
                <div className="activity-item__emoji" aria-hidden="true">
                  {session.device && /mobile|android|iphone|tablet/i.test(session.device)
                    ? <Smartphone size={16} />
                    : <Monitor size={16} />}
                </div>
                <div className="activity-item__info">
                  <div className="activity-item__title">
                    {session.device || 'Dispositivo desconocido'}
                    {session.is_revoked && <span style={{ color: 'var(--color-danger)' }}> · Revocada</span>}
                  </div>
                  <div className="activity-item__date">
                    {session.ip ? `${session.ip} · ` : ''}Iniciada {new Date(session.created_at).toLocaleString('es')}
                  </div>
                </div>
                {!session.is_revoked && (
                  <button
                    className="button button--ghost"
                    style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)' }}
                    onClick={() => revokeSessionMutation.mutate(session.id)}
                    disabled={revokeSessionMutation.isPending}
                    title="Revocar sesión"
                  >
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}