import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, ChevronDown, TrendingUp } from 'lucide-react';
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
    <div className="list-screen">
      <div className="page-header">
        <h1 className="page-header__title">Ingresos</h1>
      </div>
      <SkeletonCard count={5} />
    </div>
  );

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="list-screen">
      <div className="page-header">
        <h1 className="page-header__title">
          Ingresos{total > 0 && <span className="page-header__count">({total})</span>}
        </h1>
        <div className="page-header__actions">
          <label className="list-search" style={{ maxWidth: 260 }}>
            <Search size={14} aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar ingresos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar ingresos"
            />
          </label>
          <button className="btn btn--primary btn--sm" onClick={() => navigate('/incomes/new')}>
            <Plus size={14} /> Nuevo ingreso
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={search ? 'Sin resultados' : 'No hay ingresos'}
          message={search ? 'Prueba con otros términos' : 'Registra tu primer ingreso'}
          action={search ? { label: 'Limpiar búsqueda', onClick: () => setSearch('') } : { label: 'Nuevo ingreso', onClick: () => navigate('/incomes/new') }}
        />
      ) : (
        <Card hover={false} className="list-card">
          {filtered.map((income) => (
            <Link key={income.id} to={`/incomes/${income.id}`} className="list-item">
              <div className="list-item__dot" style={{ background: 'var(--color-success)', boxShadow: '0 0 0 4px var(--color-success-dim)' }} />
              <div className="list-item__info">
                <div className="list-item__title">{income.description}</div>
                <div className="list-item__date">{formatDate(income.income_date)}</div>
              </div>
              <MoneyDisplay amount={income.amount} size="sm" color="positive" />
            </Link>
          ))}
          {hasNextPage && (
            <div className="list-load-more">
              <button className="btn btn--ghost btn--sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <span className="btn__loader" /> : <><ChevronDown size={16} /> Cargar más</>}
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
