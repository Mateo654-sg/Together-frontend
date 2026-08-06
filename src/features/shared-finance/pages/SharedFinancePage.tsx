import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { sharedExpensesApi, couplesApi } from '@/services/api';
import { Card, CardGrid } from '@/shared/components/Card';
import { FilterToolbar } from '@/shared/components/FilterToolbar';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ActivityList } from '@/shared/components/ActivityList';
import { NewMovementButton } from '@/shared/components/NewMovementButton';
import { ExpenseFormModal } from '@/features/expenses/components/ExpenseFormModal';
import { IncomeFormModal } from '@/features/incomes/components/IncomeFormModal';
import { useToast } from '@/shared/components/Toast';
import { toFiniteNumber } from '@/shared/utils/format';
import type { ActivityItem } from '@/shared/utils/activity';
import type { SharedExpense, SharedIncome } from '@/types/api';

type FilterType = 'all' | 'expense' | 'income';
type SortType = 'newest' | 'oldest';

const FILTERS: { key: FilterType; label: string; showChevron?: boolean }[] = [
  { key: 'all', label: 'Todos', showChevron: true },
  { key: 'income', label: 'Ingresos' },
  { key: 'expense', label: 'Gastos' },
];

export default function SharedFinancePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<{ type: 'expense' | 'income'; id: string } | null>(null);

  const { data: couple } = useQuery({
    queryKey: ['couple-status'],
    queryFn: () => couplesApi.getStatus(),
  });

  const pageSize = 30;

  const expensesQuery = useInfiniteQuery({
    queryKey: ['shared-expenses', 'activity'],
    queryFn: ({ pageParam = 1 }) => sharedExpensesApi.getAll({ page: pageParam, limit: pageSize }),
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const incomesQuery = useInfiniteQuery({
    queryKey: ['shared-incomes', 'activity'],
    queryFn: ({ pageParam = 1 }) => sharedExpensesApi.getAllIncomes({ page: pageParam, limit: pageSize }),
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: (item: ActivityItem) => item._type === 'expense' ? sharedExpensesApi.remove(item.id) : sharedExpensesApi.removeIncome(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['shared-incomes'] });
      toast('success', 'Movimiento eliminado');
    },
  });

  const duplicateMutation = useMutation<SharedExpense | SharedIncome, Error, ActivityItem>({
    mutationFn: (item: ActivityItem) => item._type === 'expense'
      ? sharedExpensesApi.create({ amount: item.amount, description: `${item.description} copia`, expense_date: new Date().toISOString().split('T')[0] })
      : sharedExpensesApi.createIncome({ amount: item.amount, description: `${item.description} copia`, income_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['shared-incomes'] });
      toast('success', 'Movimiento duplicado');
    },
  });

  const allItems = useMemo(() => {
    const expenses: ActivityItem[] = (expensesQuery.data?.pages.flatMap(p => p.data) ?? []).map((e: SharedExpense) => ({
      id: e.id,
      _type: 'expense' as const,
      description: e.description,
      amount: toFiniteNumber(e.amount),
      date: e.expense_date,
      createdAt: e.created_at,
      category: 'Gasto',
    }));
    const incomes: ActivityItem[] = (incomesQuery.data?.pages.flatMap(p => p.data) ?? []).map((i: SharedIncome) => ({
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

  const summary = useMemo(() => {
    const income = allItems.filter(i => i._type === 'income').reduce((acc, item) => acc + item.amount, 0);
    const expense = allItems.filter(i => i._type === 'expense').reduce((acc, item) => acc + item.amount, 0);
    return {
      movements: allItems.length,
      income,
      expense,
      balance: income - expense,
    };
  }, [allItems]);

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

  const isLinked = couple?.status === 'accepted';
  const isLoading = expensesQuery.isLoading || incomesQuery.isLoading;
  const isError = expensesQuery.isError || incomesQuery.isError;
  const hasMore = expensesQuery.hasNextPage || incomesQuery.hasNextPage;
  const loadingMore = expensesQuery.isFetchingNextPage || incomesQuery.isFetchingNextPage;

  const handleLoadMore = () => {
    if (expensesQuery.hasNextPage) expensesQuery.fetchNextPage();
    if (incomesQuery.hasNextPage) incomesQuery.fetchNextPage();
  };

  const handleDelete = (item: ActivityItem) => {
    if (window.confirm('¿Eliminar este movimiento compartido?')) deleteMutation.mutate(item);
  };

  if (!isLinked) {
    return (
      <div>
        <div className="dashboard-header"><h1>Finanzas Compartidas</h1></div>
        <EmptyState
          icon={Users}
          title="Vincula una pareja primero"
          message="Necesitas tener una pareja vinculada para usar finanzas compartidas."
          action={{ label: 'Ir a Mi Pareja', onClick: () => navigate('/couple') }}
        />
      </div>
    );
  }

  return (
    <div className="activity-screen">
      <div className="activity-header">
        <div>
          <h1>Finanzas Compartidas</h1>
          <p>Administra los gastos e ingresos que compartes con tu pareja.</p>
        </div>
        <NewMovementButton context="shared" />
      </div>

      <CardGrid columns={4}>
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
        <Card className="activity-summary-card">
          <span>Balance</span>
          <MoneyDisplay amount={summary.balance} size="lg" color={summary.balance >= 0 ? 'positive' : 'negative'} />
        </Card>
      </CardGrid>

      <FilterToolbar
        filters={FILTERS}
        activeFilter={filter}
        onFilterChange={(key) => setFilter(key as FilterType)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar en finanzas compartidas..."
        ariaLabel="Filtros de finanzas compartidas"
        sortLabel={sort === 'newest' ? 'Más recientes' : 'Más antiguos'}
        onSortClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
        onFilterClick={() => { setFilter('all'); setSearch(''); }}
      />

      {isLoading ? (
        <SkeletonCard count={6} />
      ) : isError ? (
        <ErrorState onRetry={() => { expensesQuery.refetch(); incomesQuery.refetch(); }} />
      ) : filtered.length === 0 ? (
        <Card hover={false} className="activity-empty-card">
          <EmptyState
            icon={Users}
            title={search ? 'Sin resultados' : 'Todavía no tienes movimientos compartidos'}
            message={search ? 'Prueba con otro término o limpia los filtros.' : 'Agrega el primer gasto o ingreso que compartan.'}
            action={search ? { label: 'Limpiar búsqueda', onClick: () => setSearch('') } : undefined}
          />
        </Card>
      ) : (
        <ActivityList
          items={filtered}
          onEdit={(item) => setEditModal({ type: item._type, id: item.id })}
          onDuplicate={(item) => duplicateMutation.mutate(item)}
          onDelete={handleDelete}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
        />
      )}

      <ExpenseFormModal
        open={editModal?.type === 'expense'}
        onClose={() => setEditModal(null)}
        context="shared"
        expenseId={editModal?.type === 'expense' ? editModal.id : undefined}
      />
      <IncomeFormModal
        open={editModal?.type === 'income'}
        onClose={() => setEditModal(null)}
        context="shared"
        incomeId={editModal?.type === 'income' ? editModal.id : undefined}
      />
    </div>
  );
}
