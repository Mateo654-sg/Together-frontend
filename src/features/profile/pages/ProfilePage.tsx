import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { Card } from '@/shared/components/Card';
import { getInitials } from '@/shared/utils/format';
import { Mail, Calendar, MapPin, Phone, Camera, UserRound, Pencil } from 'lucide-react';
import { formatDate } from '@/shared/utils/format';
import { Link } from 'react-router-dom';
import { Settings, Bell, LogOut } from 'lucide-react';
import { usersApi, uploadApi } from '@/services/api';
import { useToast } from '@/shared/components/Toast';

const AVATAR_MAX_SIZE = 256;

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, payload] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('La imagen no es válida.'));
      img.onload = () => {
        const scale = Math.min(1, AVATAR_MAX_SIZE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se pudo procesar la imagen.'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: (data: { first_name: string; last_name: string; phone?: string; birth_date?: string }) =>
      usersApi.updateMe(data),
    onSuccess: (updated) => {
      setUser(updated);
      setEditing(false);
      toast('success', 'Perfil actualizado correctamente.');
    },
    onError: () => toast('error', 'No se pudo actualizar el perfil.'),
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const dataUrl = await resizeImage(file);
      const uploadFile = new File([dataUrlToBlob(dataUrl)], 'avatar.jpg', { type: 'image/jpeg' });
      const { url } = await uploadApi.uploadAvatar(uploadFile);
      return usersApi.updateAvatar(url);
    },
    onSuccess: (updated) => {
      setUser(updated);
      toast('success', 'Foto de perfil actualizada.');
    },
    onError: () => toast('error', 'No se pudo cambiar la foto de perfil.'),
  });

  if (!user) return null;

  const openEditor = () => {
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setPhone(user.phone ?? '');
    setBirthDate(user.birth_date ? user.birth_date.slice(0, 10) : '');
    setEditing(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
    e.target.value = '';
  };

  const saveProfile = () => {
    updateProfileMutation.mutate({
      first_name: firstName.trim() || user.first_name,
      last_name: lastName.trim() || user.last_name,
      phone: phone.trim() || undefined,
      birth_date: birthDate || undefined,
    });
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Perfil</h1>
      </div>

      <Card hover={false}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cambiar foto de perfil"
              style={{
                width: 72, height: 72, borderRadius: 'var(--radius-full)', padding: 0, cursor: 'pointer',
                background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'white', border: 'none',
                overflow: 'hidden',
              }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitials(user.first_name, user.last_name)
              )}
            </button>
            <div style={{
              position: 'absolute', right: 0, bottom: 0,
              width: 22, height: 22, borderRadius: 'var(--radius-full)',
              background: 'var(--color-surface-elevated)', border: '2px solid var(--color-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={12} color="var(--color-text-secondary)" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 120 }}>
                  <label className="form-label">Nombres</label>
                  <input className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 120 }}>
                  <label className="form-label">Apellidos</label>
                  <input className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {user.first_name} {user.last_name}
                </h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  Miembro desde {formatDate(user.created_at, 'long')}
                </p>
              </>
            )}
          </div>
          <button className="btn btn--ghost btn--sm" onClick={editing ? () => setEditing(false) : openEditor}>
            <Pencil size={14} /> {editing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editing && (
          <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Teléfono</label>
                <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Fecha de nacimiento</label>
                <input type="date" className="form-control" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button className="btn btn--primary btn--sm" onClick={saveProfile} disabled={updateProfileMutation.isPending}>
                <UserRound size={14} /> {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}

        <div className="info-grid">
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
