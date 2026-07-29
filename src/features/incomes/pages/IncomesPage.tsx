import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { incomesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatDate } from '@/shared/utils/format';
import { useNavigate } from 'react-router-dom';

import type { Income } from '@/types/api';

export default function IncomesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['incomes'],
    queryFn: () => incomesApi.getAll(),
  });

  const incomes: Income[] = data?.data ?? [];
  const filtered: Income[] = search
    ? incomes.filter((e) => e.description.toLowerCase().includes(search.toLowerCase()))
    : incomes;

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
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Ingresos</h1>
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
            <div
              key={income.id}
              className="activity-item"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/incomes/${income.id}`)}
            >
              <div className="activity-item__dot" style={{ background: 'var(--color-success)' }} />
              <div className="activity-item__info">
                <div className="activity-item__title">{income.description}</div>
                <div className="activity-item__date">{formatDate(income.income_date)}</div>
              </div>
              <MoneyDisplay amount={income.amount} size="sm" color="positive" />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}