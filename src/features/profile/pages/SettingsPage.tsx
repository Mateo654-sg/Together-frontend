import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { Card } from '@/shared/components/Card';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const currencies = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'CLP', 'PEN', 'BRL'];
const languages = ['es', 'en'];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(user?.currency || 'COP');
  const [language, setLanguage] = useState(user?.language || 'es');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Mock save
    await new Promise((r) => setTimeout(r, 800));
    if (user) setUser({ ...user, currency, language });
    setSaving(false);
  };

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
      </Card>
    </div>
  );
}
