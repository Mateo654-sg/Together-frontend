import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { expensesApi, incomesApi } from '@/services/api';
import { Card, CardGrid } from '@/shared/components/Card';
import { FilterToolbar } from '@/shared/components/FilterToolbar';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ActivityList } from '@/shared/components/ActivityList';
import { NewMovementButton } from '@/shared/components/NewMovementButton';
import { toFiniteNumber } from '@/shared/utils/format';
import type { ActivityItem } from '@/shared/utils/activity';

import type { Expense, Income } from '@/types/api';

type FilterType = 'all' | 'expense' | 'income';
type SortType = 'newest' | 'oldest';

const FILTERS: { key: FilterType; label: string; showChevron?: boolean }[] = [
  { key: 'all', label: 'Todos', showChevron: true },
  { key: 'income', label: 'Ingresos' },
  { key: 'expense', label: 'Gastos' },
];

export default function ActivityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [search, setSearch] = useState('');

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
        <NewMovementButton context="personal" />
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
        <ActivityList
          items={filtered}
          onRowClick={(item) => navigate(item._type === 'expense' ? `/expenses/${item.id}` : `/incomes/${item.id}`)}
          onEdit={(item) => navigate(item._type === 'expense' ? `/expenses/${item.id}/edit` : `/incomes/${item.id}/edit`)}
          onDuplicate={(item) => duplicateMutation.mutate(item)}
          onDelete={handleDelete}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
        />
      )}
    </div>
  );
}
