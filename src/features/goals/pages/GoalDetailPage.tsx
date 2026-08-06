import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Edit3, PiggyBank } from 'lucide-react';
import { goalsApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatDate, formatRelative } from '@/shared/utils/format';

export default function GoalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: goal, isLoading, isError, refetch } = useQuery({
    queryKey: ['goal', id],
    queryFn: () => goalsApi.getById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => goalsApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/goals');
    },
  });

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Detalle de Meta</h1></div>
      <SkeletonCard count={2} />
    </div>
  );
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!goal) return <ErrorState message="Meta no encontrada" />;

  return (
    <div>
      <div className="dashboard-header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn--secondary btn--sm" onClick={() => navigate(`/goals/${id}/edit`)}>
            <Edit3 size={14} /> Editar
          </button>
          <button
            className="btn btn--danger btn--sm"
            onClick={() => { if (window.confirm('¿Eliminar esta meta?')) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={14} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>

      {goal.image && (
        <img
          src={goal.image}
          alt={goal.title}
          style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-2xl)', marginBottom: 'var(--space-4)' }}
        />
      )}

      <Card hover={false}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-500)' }}>
            <PiggyBank size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{goal.title}</h2>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Creada {formatRelative(goal.created_at)}
            </span>
          </div>
        </div>

        {goal.description && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {goal.description}
          </p>
        )}

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Progreso</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{goal.progress_percentage ?? 0}%</span>
          </div>
          <ProgressBar progress={goal.progress_percentage ?? 0} />
        </div>

        <div className="info-grid">
          <div>
            <div className="stat-card__label">Ahorrado</div>
            <MoneyDisplay amount={goal.current_amount} size="lg" color="primary" />
          </div>
          <div>
            <div className="stat-card__label">Meta</div>
            <MoneyDisplay amount={goal.target_amount} size="lg" />
          </div>
          {goal.target_date && (
            <div>
              <div className="stat-card__label">Fecha límite</div>
              <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
                {formatDate(goal.target_date, 'long')}
              </div>
            </div>
          )}
          {goal.days_remaining !== null && goal.days_remaining !== undefined && (
            <div>
              <div className="stat-card__label">Días restantes</div>
              <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
                {goal.days_remaining} días
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
