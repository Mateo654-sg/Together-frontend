import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, PiggyBank, Target, CheckCircle, Clock } from 'lucide-react';
import { goalsApi } from '@/services/api';
import { Card, CardGrid } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import { useNavigate } from 'react-router-dom';

import type { Goal } from '@/types/api';

export default function GoalsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getAll(),
  });

  const goals: Goal[] = data?.data ?? [];
  const filtered: Goal[] = filter === 'all' ? goals : goals.filter((g: Goal) => g.status === filter);

  const statusIcons = { active: Target, completed: CheckCircle, cancelled: Clock } as const;
  const statusColors = { active: 'var(--color-brand-500)', completed: 'var(--color-success)', cancelled: 'var(--color-text-muted)' } as const;

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Metas</h1></div>
      <SkeletonCard count={3} />
    </div>
  );
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Metas de Ahorro</h1>
        <button className="btn btn--primary btn--sm" onClick={() => navigate('/goals/new')}>
          <Plus size={14} /> Nueva Meta
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            className={`btn btn--sm ${filter === f ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Completadas'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={filter === 'all' ? 'Sin metas de ahorro' : 'No hay metas en este estado'}
          message="Define tus metas financieras y empieza a ahorrar"
          action={{ label: 'Crear Meta', onClick: () => navigate('/goals/new') }}
        />
      ) : (
        <CardGrid columns={2}>
          {filtered.map((goal) => {
            const StatusIcon = statusIcons[goal.status];
            return (
              <Card key={goal.id} onClick={() => navigate(`/goals/${goal.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{goal.title}</h3>
                  <StatusIcon size={18} color={statusColors[goal.status as keyof typeof statusColors]} />
                </div>
                {goal.description && (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                    {goal.description}
                  </p>
                )}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Progreso</span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {goal.progress_percentage ?? 0}%
                    </span>
                  </div>
                  <ProgressBar progress={goal.progress_percentage ?? 0} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <MoneyDisplay amount={goal.current_amount} size="sm" color="primary" />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    de {formatCurrency(goal.target_amount)}
                  </span>
                </div>
                {goal.target_date && (
                  <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Meta: {formatDate(goal.target_date)}
                  </div>
                )}
              </Card>
            );
          })}
        </CardGrid>
      )}
    </div>
  );
}
