import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { notificationsApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatRelative } from '@/shared/utils/format';

import type { Notification } from '@/types/api';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: Notification[] = data?.data ?? [];

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Notificaciones</h1></div>
      <SkeletonCard count={4} />
    </div>
  );
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Notificaciones
        </h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn--ghost btn--sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}><CheckCheck size={14} /> {markAllRead.isPending ? 'Marcando...' : 'Marcar todas leídas'}</button>
          <button className="btn btn--secondary btn--sm" onClick={() => refetch()}><RefreshCw size={14} /></button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Sin notificaciones" message="No tienes notificaciones pendientes" />
      ) : (
        <Card hover={false}>
          {notifications.map((notif: Notification) => (
            <div key={notif.id} className="activity-item" style={{ opacity: notif.is_read ? 0.5 : 1 }}>
              <div className="activity-item__dot" style={{
                background: notif.is_read ? 'transparent' : 'var(--color-brand-500)',
                border: notif.is_read ? '2px solid var(--color-text-muted)' : 'none',
              }} />
              <div className="activity-item__info">
                <div className="activity-item__title">{notif.title}</div>
                <div className="activity-item__date">{notif.message} · {formatRelative(notif.created_at)}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
