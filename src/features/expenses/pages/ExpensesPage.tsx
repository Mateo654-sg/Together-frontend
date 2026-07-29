import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter, Search, ArrowUpDown } from 'lucide-react';
import { expensesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatDate, formatRelative } from '@/shared/utils/format';
import { Link, useNavigate } from 'react-router-dom';

import type { Expense } from '@/types/api';

export default function ExpensesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll(),
  });

  const expenses: Expense[] = data?.data ?? [];
  const filtered: Expense[] = search
    ? expenses.filter((e) => e.description.toLowerCase().includes(search.toLowerCase()))
    : expenses;

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Gastos</h1></div>
      <SkeletonCard count={5} />
    </div>
  );

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Gastos</h1>
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
          <button className="btn btn--secondary btn--sm"><Filter size={14} /> Filtros</button>
          <button className="btn btn--primary btn--sm" onClick={() => navigate('/expenses/new')}>
            <Plus size={14} /> Nuevo Gasto
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? 'Sin resultados' : 'No hay gastos'}
          message={search ? 'Prueba con otros términos' : 'Registra tu primer gasto'}
          action={search ? undefined : { label: 'Nuevo Gasto', onClick: () => navigate('/expenses/new') }}
        />
      ) : (
        <Card hover={false}>
          {filtered.map((expense) => (
            <Link
              key={expense.id}
              to={`/expenses/${expense.id}`}
              className="activity-item"
              style={{ textDecoration: 'none', display: 'flex', cursor: 'pointer' }}
            >
              <div className="activity-item__dot" style={{ background: 'var(--color-danger)' }} />
              <div className="activity-item__info">
                <div className="activity-item__title">{expense.description}</div>
                <div className="activity-item__date">{formatDate(expense.expense_date)}</div>
              </div>
              <MoneyDisplay amount={expense.amount} size="sm" color="negative" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
