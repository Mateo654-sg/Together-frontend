import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, ChevronDown, Plus, TrendingDown, TrendingUp, List } from 'lucide-react';
import { expensesApi, incomesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatRelative } from '@/shared/utils/format';

import type { Expense, Income } from '@/types/api';

type FilterType = 'all' | 'expense' | 'income';

type ActivityItem = {
  id: string;
  _type: 'expense' | 'income';
  description: string;
  amount: number;
  date: string;
};

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'income', label: 'Ingresos' },
  { key: 'expense', label: 'Gastos' },
];

export default function ActivityPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pageSize = 30;

  const expensesQuery = useInfiniteQuery({
    queryKey: ['expenses', 'activity'],
    queryFn: ({ pageParam = 1 }) => expensesApi.getAll({ page: pageParam, limit: pageSize }),
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const incomesQuery = useInfiniteQuery({
    queryKey: ['incomes', 'activity'],
    queryFn: ({ pageParam = 1 }) => incomesApi.getAll({ page: pageParam, limit: pageSize }),
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allItems = useMemo(() => {
    const expenses: ActivityItem[] = (expensesQuery.data?.pages.flatMap(p => p.data) ?? []).map((e: Expense) => ({
      id: e.id,
      _type: 'expense' as const,
      description: e.description,
      amount: e.amount,
      date: e.expense_date,
    }));
    const incomes: ActivityItem[] = (incomesQuery.data?.pages.flatMap(p => p.data) ?? []).map((i: Income) => ({
      id: i.id,
      _type: 'income' as const,
      description: i.description,
      amount: i.amount,
      date: i.income_date,
    }));
    const combined = [...expenses, ...incomes];
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }, [expensesQuery.data, incomesQuery.data]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (filter !== 'all') {
      items = items.filter(i => i._type === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.description.toLowerCase().includes(q));
    }
    return items;
  }, [allItems, filter, search]);

  const isLoading = expensesQuery.isLoading || incomesQuery.isLoading;
  const isError = expensesQuery.isError || incomesQuery.isError;
  const hasMore = expensesQuery.hasNextPage || incomesQuery.hasNextPage;
  const loadingMore = expensesQuery.isFetchingNextPage || incomesQuery.isFetchingNextPage;

  const handleLoadMore = () => {
    if (expensesQuery.hasNextPage) expensesQuery.fetchNextPage();
    if (incomesQuery.hasNextPage) incomesQuery.fetchNextPage();
  };

  if (isLoading) {
    return (
      <div>
        <div className="dashboard-header"><h1>Actividad</h1></div>
        <SkeletonCard count={6} />
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => { expensesQuery.refetch(); incomesQuery.refetch(); }} />;

  return (
    <div>
      <div className="dashboard-header">
        <h1>Actividad</h1>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button className="btn btn--primary btn--sm" onClick={() => setMenuOpen(!menuOpen)}>
            <Plus size={14} /> Nuevo
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/expenses/new'); }}>
                <TrendingDown size={16} /> Nuevo Gasto
              </button>
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/incomes/new'); }}>
                <TrendingUp size={16} /> Nuevo Ingreso
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'filter-tab--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <div className="filter-tabs__search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={List}
          title={search ? 'Sin resultados' : 'Sin actividad'}
          message={search ? 'Prueba con otros términos' : 'No hay transacciones registradas aún'}
          action={search ? undefined : { label: 'Nuevo Gasto', onClick: () => navigate('/expenses/new') }}
        />
      ) : (
        <Card hover={false}>
          {filtered.map((item) => (
            <Link
              key={`${item._type}-${item.id}`}
              to={item._type === 'expense' ? `/expenses/${item.id}` : `/incomes/${item.id}`}
              className="activity-item"
            >
              <div
                className="activity-item__dot"
                style={{ background: item._type === 'expense' ? 'var(--color-danger)' : 'var(--color-success)' }}
              />
              <div className="activity-item__info">
                <div className="activity-item__title">{item.description}</div>
                <div className="activity-item__date">{formatRelative(item.date)}</div>
              </div>
              <div className="activity-item__amount">
                <MoneyDisplay
                  amount={item.amount}
                  size="sm"
                  color={item._type === 'expense' ? 'negative' : 'positive'}
                />
              </div>
            </Link>
          ))}
          {hasMore && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <button
                className="btn btn--ghost btn--sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? <span className="btn__loader" /> : <><ChevronDown size={16} /> Cargar más</>}
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
