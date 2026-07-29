import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Activity } from 'lucide-react';
import { dashboardApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatRelative } from '@/shared/utils/format';

export default function ActivityPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['activity'],
    queryFn: () => dashboardApi.get(),
  });

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Actividad</h1></div>
      <SkeletonCard count={5} />
    </div>
  );
  if (isError) return <ErrorState onRetry={refetch} />;

  const activities = data?.recent_activity ?? [];

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Actividad Reciente
        </h1>
        <button className="btn btn--secondary btn--sm" onClick={() => refetch()}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {activities.length === 0 ? (
        <EmptyState icon={Activity} title="Sin actividad" message="No hay transacciones registradas aún" />
      ) : (
        <Card hover={false}>
          {activities.map((item) => (
            <div key={item.id} className="activity-item">
              <div
                className="activity-item__dot"
                style={{
                  background: item.type === 'expense' ? 'var(--color-danger)' : item.type === 'income' ? 'var(--color-success)' : 'var(--color-brand-500)',
                }}
              />
              <div className="activity-item__info">
                <div className="activity-item__title">{item.description}</div>
                <div className="activity-item__date">{formatRelative(item.date)}{item.category ? ` · ${item.category}` : ''}</div>
              </div>
              <div className="activity-item__amount">
                <MoneyDisplay
                  amount={item.amount}
                  size="sm"
                  color={item.type === 'expense' ? 'negative' : item.type === 'income' ? 'positive' : 'muted'}
                />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
