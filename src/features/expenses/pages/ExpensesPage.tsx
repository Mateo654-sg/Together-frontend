import { Plus, Search, ChevronDown, TrendingDown } from 'lucide-react';
import { expensesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatDate } from '@/shared/utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { usePaginatedQuery } from '@/shared/hooks/usePaginatedQuery';

import type { Expense } from '@/types/api';

export default function ExpensesPage() {
  const navigate = useNavigate();
  const {
    items: filtered, isLoading, isError, isFetchingNextPage, hasNextPage,
    fetchNextPage, refetch, search, setSearch, total,
  } = usePaginatedQuery<Expense>({
    queryKey: ['expenses'],
    queryFn: (params) => expensesApi.getAll(params),
    filterFn: (item, q) => item.description.toLowerCase().includes(q),
  });

  if (isLoading) return (
    <div className="list-screen">
      <div className="page-header">
        <h1 className="page-header__title">Gastos</h1>
      </div>
      <SkeletonCard count={5} />
    </div>
  );

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="list-screen">
      <div className="page-header">
        <h1 className="page-header__title">
          Gastos{total > 0 && <span className="page-header__count">({total})</span>}
        </h1>
        <div className="page-header__actions">
          <label className="list-search" style={{ maxWidth: 260 }}>
            <Search size={14} aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar gastos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar gastos"
            />
          </label>
          <button className="btn btn--primary btn--sm" onClick={() => navigate('/expenses/new')}>
            <Plus size={14} /> Nuevo gasto
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title={search ? 'Sin resultados' : 'No hay gastos'}
          message={search ? 'Prueba con otros términos' : 'Registra tu primer gasto'}
          action={search ? { label: 'Limpiar búsqueda', onClick: () => setSearch('') } : { label: 'Nuevo gasto', onClick: () => navigate('/expenses/new') }}
        />
      ) : (
        <Card hover={false} className="list-card">
          {filtered.map((expense) => (
            <Link key={expense.id} to={`/expenses/${expense.id}`} className="list-item">
              <div className="list-item__dot" style={{ background: 'var(--color-danger)', boxShadow: '0 0 0 4px var(--color-danger-dim)' }} />
              <div className="list-item__info">
                <div className="list-item__title">{expense.description}</div>
                <div className="list-item__date">{formatDate(expense.expense_date)}</div>
              </div>
              <MoneyDisplay amount={expense.amount} size="sm" color="negative" />
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
