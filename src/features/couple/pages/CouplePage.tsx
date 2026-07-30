import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, UserPlus, UserX, Share2, Copy, Check, Users } from 'lucide-react';
import { couplesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';

export default function CouplePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const { data: status, isLoading, isError, refetch } = useQuery({
    queryKey: ['couple-status'],
    queryFn: () => couplesApi.getStatus(),
  });

  const [showAccept, setShowAccept] = useState(false);

  const inviteMutation = useMutation({
    mutationFn: () => couplesApi.invite(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple-status'] });
      toast('success', 'Código de invitación generado');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () => couplesApi.accept(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple-status'] });
      toast('success', '¡Pareja vinculada exitosamente!');
      setShowAccept(false);
      setInviteCode('');
    },
    onError: () => {
      toast('error', 'Código inválido o ya expiró');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => couplesApi.reject(''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple-status'] });
      toast('info', 'Invitación rechazada');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: () => couplesApi.unlink(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple-status'] });
      toast('info', 'Pareja desvinculada');
    },
  });

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      toast('success', 'Código copiado al portapapeles');
      setTimeout(() => setCopySuccess(false), 3000);
    } catch {
      toast('error', 'No se pudo copiar el código');
    }
  };

  const relationshipStatus = status?.status || 'none';
  const partner = status?.partner;
  const invitationCode = status?.couple?.invitation_code;

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Mi Pareja</h1></div>
      <SkeletonCard count={3} />
    </div>
  );

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="dashboard-header">
        <h1>Mi Pareja</h1>
      </div>

      {relationshipStatus === 'none' && (
        <Card hover={false}>
          <EmptyState
            icon={Heart}
            title="Aún no tienes pareja vinculada"
            message="Invita a tu pareja para comenzar a construir metas juntos ❤️"
            action={{ label: 'Generar código de invitación', onClick: () => inviteMutation.mutate() }}
          />

          {inviteMutation.data && (
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
              <p style={{ marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                Comparte este código con tu pareja:
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-4) var(--space-6)',
                background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border-default)',
              }}>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                  {inviteMutation.data.invitation_code}
                </span>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => copyCode(inviteMutation.data.invitation_code!)}
                  title="Copiar código"
                >
                  {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            <button
              className="btn btn--secondary"
              onClick={() => setShowAccept(!showAccept)}
            >
              <UserPlus size={16} /> Tengo un código de invitación
            </button>

            {showAccept && (
              <div style={{
                marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)',
                justifyContent: 'center', flexWrap: 'wrap',
              }}>
                <input
                  style={{ maxWidth: 280 }}
                  placeholder="Ingresa el código"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && acceptMutation.mutate()}
                />
                <button
                  className="btn btn--primary"
                  disabled={!inviteCode || acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate()}
                >
                  {acceptMutation.isPending ? 'Vinculando...' : 'Aceptar invitación'}
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {relationshipStatus === 'pending' && (
        <Card hover={false}>
          <EmptyState
            icon={Users}
            title="Invitación pendiente"
            message="Tu pareja aún no ha aceptado la invitación. Comparte el código para que pueda vincularse."
          />
          {invitationCode && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
              <p style={{ marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                Código de invitación:
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-5)',
                background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border-default)',
              }}>
                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                  {invitationCode}
                </span>
                <button className="btn btn--ghost btn--sm" onClick={() => copyCode(invitationCode)}>
                  {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => { if (window.confirm('¿Cancelar la invitación?')) rejectMutation.mutate(); }}
                >
                  Cancelar invitación
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {relationshipStatus === 'accepted' && partner && (
        <Card hover={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 'var(--radius-full)',
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'white',
              flexShrink: 0,
            }}>
              {partner.first_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                {partner.first_name} {partner.last_name}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                {partner.email}
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
                marginTop: 'var(--space-2)', padding: '2px var(--space-2)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-success-dim)',
                color: 'var(--color-success)',
                fontSize: 'var(--text-xs)', fontWeight: 600,
              }}>
                <Heart size={12} /> Vinculados
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <button
              className="btn btn--secondary"
              onClick={() => navigate('/shared-finance')}
            >
              <Share2 size={16} /> Finanzas compartidas
            </button>
            <button
              className="btn btn--danger btn--sm"
              onClick={() => {
                if (window.confirm('¿Estás seguro de desvincular tu pareja? Se perderán los datos compartidos.')) {
                  unlinkMutation.mutate();
                }
              }}
              disabled={unlinkMutation.isPending}
            >
              <UserX size={16} /> {unlinkMutation.isPending ? 'Desvinculando...' : 'Desvincular pareja'}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
