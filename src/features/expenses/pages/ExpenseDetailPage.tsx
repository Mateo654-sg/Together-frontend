import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Edit3 } from 'lucide-react';
import { expensesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatDate, formatRelative } from '@/shared/utils/format';

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: expense, isLoading, isError, refetch } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Detalle del Gasto</h1></div>
      <SkeletonCard count={2} />
    </div>
  );
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!expense) return <ErrorState message="Gasto no encontrado" />;

  return (
    <div>
      <div className="dashboard-header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn--secondary btn--sm"><Edit3 size={14} /> Editar</button>
          <button className="btn btn--danger btn--sm"><Trash2 size={14} /> Eliminar</button>
        </div>
      </div>
      <Card hover={false}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{expense.description}</h2>
          <MoneyDisplay amount={expense.amount} size="xl" color="negative" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <div className="stat-card__label">Fecha</div>
            <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              {formatDate(expense.expense_date, 'long')}
            </div>
          </div>
          <div>
            <div className="stat-card__label">Categoría</div>
            <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              {expense.category_id || 'Sin categoría'}
            </div>
          </div>
          <div>
            <div className="stat-card__label">Método de pago</div>
            <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              {expense.payment_method || 'No especificado'}
            </div>
          </div>
          <div>
            <div className="stat-card__label">Ubicación</div>
            <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
              {expense.location || 'No especificada'}
            </div>
          </div>
        </div>
        {expense.notes && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div className="stat-card__label">Notas</div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 4 }}>{expense.notes}</p>
          </div>
        )}
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Creado {formatRelative(expense.created_at)}
          </div>
        </div>
      </Card>
    </div>
  );
}
