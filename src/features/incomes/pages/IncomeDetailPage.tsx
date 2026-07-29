import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { incomesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatDate, formatRelative } from '@/shared/utils/format';

export default function IncomeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: income, isLoading, isError, refetch } = useQuery({
    queryKey: ['income', id],
    queryFn: () => incomesApi.getById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => incomesApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      navigate('/incomes');
    },
  });

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Detalle del Ingreso</h1></div>
      <SkeletonCard count={2} />
    </div>
  );
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!income) return <ErrorState message="Ingreso no encontrado" />;

  return (
    <div>
      <div className="dashboard-header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>
        <button
          className="btn btn--danger btn--sm"
          onClick={() => { if (window.confirm('¿Eliminar este ingreso?')) deleteMutation.mutate(); }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={14} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
      <Card hover={false}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{income.description}</h2>
          <MoneyDisplay amount={income.amount} size="xl" color="positive" />
        </div>
        <div className="info-grid">
          <div>
            <div className="stat-card__label">Fecha</div>
            <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              {formatDate(income.income_date, 'long')}
            </div>
          </div>
          <div>
            <div className="stat-card__label">Categoría</div>
            <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              {income.category_id || 'Sin categoría'}
            </div>
          </div>
        </div>
        {income.notes && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div className="stat-card__label">Notas</div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>{income.notes}</p>
          </div>
        )}
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Creado {formatRelative(income.created_at)}
          </div>
        </div>
      </Card>
    </div>
  );
}