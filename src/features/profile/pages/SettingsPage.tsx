import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { Card } from '@/shared/components/Card';
import { ErrorState } from '@/shared/components/ErrorState';
import { ArrowLeft, Save, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '@/services/api';

const currencies = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'CLP', 'PEN', 'BRL'];
const languages = ['es', 'en'];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('COP');
  const [language, setLanguage] = useState('es');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState('light');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    usersApi.getSettings()
      .then((settings) => {
        setCurrency(settings.currency || user?.currency || 'COP');
        setLanguage(settings.language || user?.language || 'es');
        setNotificationsEnabled(settings.notifications_enabled ?? true);
        setTheme(settings.theme || 'light');
      })
      .catch(() => {
        setCurrency(user?.currency || 'COP');
        setLanguage(user?.language || 'es');
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSave = async () => {
    setSaving(true);
    setError(false);
    try {
      await usersApi.updateSettings({ currency, language, notifications_enabled: notificationsEnabled, theme });
      if (user) setUser({ ...user, currency, language });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

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
              const response = await fetch('/api/v1/users/export');
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `together-data-${new Date().toISOString().split('T')[0]}.zip`;
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
    </div>
  );
}