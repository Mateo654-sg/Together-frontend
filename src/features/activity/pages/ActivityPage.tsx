import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown, Copy, Edit2, FileText, Plus,
  Trash2, TrendingDown, TrendingUp,
} from 'lucide-react';
import { expensesApi, incomesApi } from '@/services/api';
import { Card, CardGrid } from '@/shared/components/Card';
import { FilterToolbar } from '@/shared/components/FilterToolbar';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatRelative, toFiniteNumber } from '@/shared/utils/format';

import type { Expense, Income } from '@/types/api';

type FilterType = 'all' | 'expense' | 'income';
type SortType = 'newest' | 'oldest';

type ActivityItem = {
  id: string;
  _type: 'expense' | 'income';
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  category: string;
};

const FILTERS: { key: FilterType; label: string; showChevron?: boolean }[] = [
  { key: 'all', label: 'Todos', showChevron: true },
  { key: 'income', label: 'Ingresos' },
  { key: 'expense', label: 'Gastos' },
];

function getMovementIcon(item: ActivityItem) {
  if (item.category !== 'Gasto' && item.description.toLowerCase().includes('aporte a meta')) return '💰';
  if (item._type === 'income') return '💼';
  const text = item.description.toLowerCase();
  if (text.includes('comida') || text.includes('pan') || text.includes('restaurant')) return '🍔';
  if (text.includes('mercado') || text.includes('super') || text.includes('walmart')) return '🛒';
  if (text.includes('transporte') || text.includes('uber') || text.includes('taxi')) return '🚗';
  if (text.includes('casa') || text.includes('arriendo') || text.includes('hogar')) return '🏠';
  return '💳';
}

function getGroupLabel(dateValue: string) {
  const date = new Date(dateValue);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.floor((startOfToday - startOfDate) / 86_400_000);

  if (dayDiff === 0) return 'Hoy';
  if (dayDiff === 1) return 'Ayer';
  if (dayDiff < 7) return 'Esta semana';
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export default function ActivityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
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

  const deleteMutation = useMutation({
    mutationFn: (item: ActivityItem) => item._type === 'expense' ? expensesApi.remove(item.id) : incomesApi.remove(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const duplicateMutation = useMutation<Expense | Income, Error, ActivityItem>({
    mutationFn: (item: ActivityItem) => item._type === 'expense'
      ? expensesApi.create({ amount: item.amount, description: `${item.description} copia`, expense_date: new Date().toISOString().split('T')[0] })
      : incomesApi.create({ amount: item.amount, description: `${item.description} copia`, income_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const allItems = useMemo(() => {
    const expenses: ActivityItem[] = (expensesQuery.data?.pages.flatMap(p => p.data) ?? []).map((e: Expense) => ({
      id: e.id,
      _type: 'expense' as const,
      description: e.description,
      amount: toFiniteNumber(e.amount),
      date: e.expense_date,
      createdAt: e.created_at,
      category: e.payment_method === 'Ahorro' && e.notes ? e.notes : 'Gasto',
    }));
    const incomes: ActivityItem[] = (incomesQuery.data?.pages.flatMap(p => p.data) ?? []).map((i: Income) => ({
      id: i.id,
      _type: 'income' as const,
      description: i.description,
      amount: toFiniteNumber(i.amount),
      date: i.income_date,
      createdAt: i.created_at,
      category: 'Ingreso',
    }));
    return [...expenses, ...incomes];
  }, [expensesQuery.data, incomesQuery.data]);

  const summary = useMemo(() => ({
    movements: allItems.length,
    income: allItems.filter(i => i._type === 'income').reduce((acc, item) => acc + item.amount, 0),
    expense: allItems.filter(i => i._type === 'expense').reduce((acc, item) => acc + item.amount, 0),
  }), [allItems]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (filter !== 'all') items = items.filter(i => i._type === filter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    return [...items].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === 'newest' ? diff : -diff;
    });
  }, [allItems, filter, search, sort]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, ActivityItem[]>>((groups, item) => {
      const label = getGroupLabel(item.createdAt);
      groups[label] = groups[label] ? [...groups[label], item] : [item];
      return groups;
    }, {});
  }, [filtered]);

  const isLoading = expensesQuery.isLoading || incomesQuery.isLoading;
  const isError = expensesQuery.isError || incomesQuery.isError;
  const hasMore = expensesQuery.hasNextPage || incomesQuery.hasNextPage;
  const loadingMore = expensesQuery.isFetchingNextPage || incomesQuery.isFetchingNextPage;

  const handleLoadMore = () => {
    if (expensesQuery.hasNextPage) expensesQuery.fetchNextPage();
    if (incomesQuery.hasNextPage) incomesQuery.fetchNextPage();
  };

  const handleDelete = (item: ActivityItem) => {
    if (window.confirm('¿Eliminar este movimiento?')) deleteMutation.mutate(item);
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
    <div className="activity-screen">
      <div className="activity-header">
        <div>
          <h1>Actividad</h1>
          <p>Consulta y administra todos tus movimientos financieros.</p>
        </div>
        <div ref={menuRef} className="activity-new-menu">
          <button className="btn btn--primary" type="button" onClick={() => setMenuOpen(!menuOpen)}>
            <Plus size={18} /> Nuevo movimiento
          </button>
          {menuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/expenses/new'); }}>
                <TrendingDown size={16} /> Nuevo gasto
              </button>
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/incomes/new'); }}>
                <TrendingUp size={16} /> Nuevo ingreso
              </button>
            </div>
          )}
        </div>
      </div>

      <CardGrid columns={3}>
        <Card className="activity-summary-card">
          <span>Movimientos</span>
          <strong>{summary.movements}</strong>
        </Card>
        <Card className="activity-summary-card">
          <span>Ingresos</span>
          <MoneyDisplay amount={summary.income} size="lg" color="positive" />
        </Card>
        <Card className="activity-summary-card">
          <span>Gastos</span>
          <MoneyDisplay amount={summary.expense} size="lg" color="negative" />
        </Card>
      </CardGrid>

      <FilterToolbar
        filters={FILTERS}
        activeFilter={filter}
        onFilterChange={(key) => setFilter(key as FilterType)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar movimientos..."
        ariaLabel="Filtros de movimientos"
        sortLabel={sort === 'newest' ? 'Más recientes' : 'Más antiguos'}
        onSortClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
        onFilterClick={() => { setFilter('all'); setSearch(''); }}
      />

      {filtered.length === 0 ? (
        <Card hover={false} className="activity-empty-card">
          <EmptyState
            icon={FileText}
            title={search ? 'Sin resultados' : 'Todavía no tienes movimientos registrados'}
            message={search ? 'Prueba con otro término o limpia los filtros.' : 'Comienza agregando tu primer ingreso o gasto.'}
            action={search ? { label: 'Limpiar búsqueda', onClick: () => setSearch('') } : { label: 'Agregar movimiento', onClick: () => navigate('/expenses/new') }}
          />
        </Card>
      ) : (
        <div className="activity-groups">
          {Object.entries(grouped).map(([label, items]) => (
            <section key={label} className="activity-group">
              <h2>{label}</h2>
              <Card hover={false} className="activity-list-card">
                {items.map((item) => (
                  <div key={`${item._type}-${item.id}`} className="activity-row" onClick={() => navigate(item._type === 'expense' ? `/expenses/${item.id}` : `/incomes/${item.id}`)}>
                    <div className="activity-row__icon" aria-hidden="true">{getMovementIcon(item)}</div>
                    <div className="activity-row__main">
                      <div className="activity-row__title">{item.description}</div>
                      <div className="activity-row__meta">
                        <span>{item.category}</span>
                        <span>{formatRelative(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className={`activity-row__indicator activity-row__indicator--${item._type}`} aria-hidden="true" />
                    <div className="activity-row__amount">
                      <MoneyDisplay amount={item._type === 'expense' ? -item.amount : item.amount} size="md" color={item._type === 'expense' ? 'negative' : 'positive'} />
                    </div>
                    <div className="activity-row__actions" onClick={(event) => event.stopPropagation()}>
                      <button type="button" title="Editar" onClick={() => navigate(item._type === 'expense' ? `/expenses/${item.id}/edit` : `/incomes/${item.id}/edit`)}><Edit2 size={14} /></button>
                      <button type="button" title="Duplicar" onClick={() => duplicateMutation.mutate(item)}><Copy size={14} /></button>
                      <button type="button" title="Eliminar" onClick={() => handleDelete(item)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          ))}
          {hasMore && (
            <div className="activity-load-more">
              <button className="btn btn--ghost btn--sm" type="button" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? <span className="btn__loader" /> : <><ChevronDown size={16} /> Cargar más</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
