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
    <div className="list-screen">
      <div className="page-header"><h1 className="page-header__title">Notificaciones</h1></div>
      <SkeletonCard count={4} />
    </div>
  );
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="list-screen">
      <div className="page-header">
        <h1 className="page-header__title">Notificaciones</h1>
        <div className="page-header__actions">
          <button className="btn btn--ghost btn--sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck size={14} /> {markAllRead.isPending ? 'Marcando...' : 'Marcar leídas'}
          </button>
          <button className="btn btn--secondary btn--sm" onClick={() => refetch()} aria-label="Actualizar">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Sin notificaciones" message="No tienes notificaciones pendientes" />
      ) : (
        <Card hover={false} className="list-card">
          {notifications.map((notif: Notification) => (
            <div key={notif.id} className="notification-item" style={{ opacity: notif.is_read ? 0.6 : 1 }}>
              <div className="notification-item__icon">
                <Bell size={18} />
              </div>
              <div className="notification-item__body">
                <div className="notification-item__title">{notif.title}</div>
                <div className="notification-item__message">{notif.message}</div>
                <div className="notification-item__date">{formatRelative(notif.created_at)}</div>
              </div>
              {!notif.is_read && <div className="notification-item__dot" aria-label="No leída" />}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
