import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, ChevronDown } from 'lucide-react';
import { incomesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatDate } from '@/shared/utils/format';
import { usePaginatedQuery } from '@/shared/hooks/usePaginatedQuery';

import type { Income } from '@/types/api';

export default function IncomesPage() {
  const navigate = useNavigate();
  const {
    items: filtered, isLoading, isError, isFetchingNextPage, hasNextPage,
    fetchNextPage, refetch, search, setSearch, total,
  } = usePaginatedQuery<Income>({
    queryKey: ['incomes'],
    queryFn: (params) => incomesApi.getAll(params),
    filterFn: (item, q) => item.description.toLowerCase().includes(q),
  });

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Ingresos</h1></div>
      <SkeletonCard count={5} />
    </div>
  );

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Ingresos {total > 0 && <span style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: 'var(--color-text-muted)' }}>({total})</span>}
        </h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="topbar__search" style={{ position: 'relative', width: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'inherit', width: '100%', paddingLeft: 24, fontSize: 'inherit' }}
            />
          </div>
          <button className="btn btn--primary btn--sm" onClick={() => navigate('/incomes/new')}>
            <Plus size={14} /> Nuevo Ingreso
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? 'Sin resultados' : 'No hay ingresos'}
          message={search ? 'Prueba con otros términos' : 'Registra tu primer ingreso'}
          action={search ? undefined : { label: 'Nuevo Ingreso', onClick: () => navigate('/incomes/new') }}
        />
      ) : (
        <Card hover={false}>
          {filtered.map((income) => (
            <Link
              key={income.id}
              to={`/incomes/${income.id}`}
              className="activity-item"
              style={{ textDecoration: 'none' }}
            >
              <div className="activity-item__dot" style={{ background: 'var(--color-success)' }} />
              <div className="activity-item__info">
                <div className="activity-item__title">{income.description}</div>
                <div className="activity-item__date">{formatDate(income.income_date)}</div>
              </div>
              <MoneyDisplay amount={income.amount} size="sm" color="positive" />
            </Link>
          ))}
          {hasNextPage && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? <span className="btn__loader" /> : <><ChevronDown size={16} /> Cargar más</>}
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
