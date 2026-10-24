import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Wallet, AlertTriangle, Edit3, Trash2 } from 'lucide-react';
import { budgetsApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { toFiniteNumber } from '@/shared/utils/format';
import type { Budget } from '@/types/api';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function BudgetsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['budgets', filterMonth, filterYear],
    queryFn: () => budgetsApi.getAll({ month: filterMonth, year: filterYear }),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['budget-alerts', filterMonth, filterYear],
    queryFn: () => budgetsApi.getAlerts(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast('success', 'Presupuesto eliminado');
    },
  });

  const budgets = data?.data || [];
  const alerts = alertsData?.data || [];

  return (
    <div className="list-screen">
      <div className="page-header">
        <div className="page-header__intro">
          <h1>Presupuestos</h1>
          <p>Controla cuánto gastas en cada categoría mensualmente.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => navigate('/budgets/new')}>
            <Plus size={16} /> Nuevo presupuesto
          </button>
        </div>
      </div>

      <div className="budget-filters">
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
          {MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => (
            <option key={filterYear - 2 + i} value={filterYear - 2 + i}>{filterYear - 2 + i}</option>
          ))}
        </select>
      </div>

      {alerts.length > 0 && (
        <div className="budget-alerts">
          <div className="budget-alerts__header">
            <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
            <span className="budget-alerts__title">Alertas de presupuesto</span>
          </div>
          <ul className="budget-alerts__list">
            {alerts.slice(0, 5).map((a, i) => (
              <li key={i} className="budget-alert-item">
                <span>Consumido el {Math.round(a.percentage)}% ({toFiniteNumber(a.spent).toFixed(2)} de {toFiniteNumber(a.amount).toFixed(2)})</span>
                <span className={`budget-alert-item__status ${a.percentage >= 100 ? 'budget-alert-item__status--exceeded' : 'budget-alert-item__status--warning'}`}>
                  {a.percentage >= 100 ? 'Excedido' : `${Math.round(a.percentage)}%`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading ? (
        <SkeletonCard count={3} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin presupuestos"
          message="Crea tu primer presupuesto mensual para controlar tus gastos."
          action={{ label: 'Crear presupuesto', onClick: () => navigate('/budgets/new') }}
        />
      ) : (
        <div className="goals-grid">
          {budgets.map((budget: Budget) => {
            const pct = budget.percentage_consumed ?? 0;
            const level = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe';
            const statusLabels = { danger: 'Excedido', warning: 'Alerta', safe: 'OK' };
            return (
              <Card key={budget.id} hover={false}>
                <div className="budget-card__header">
                  <div className="budget-card__info">
                    <h3>{budget.category_name || 'General'}</h3>
                    <p className="budget-card__period">{MONTHS[budget.month - 1]} {budget.year}</p>
                  </div>
                  <span className={`budget-card__status budget-card__status--${level}`}>
                    {statusLabels[level]}
                  </span>
                </div>

                <ProgressBar
                  progress={pct}
                  color={level === 'danger' ? 'var(--color-danger)' : level === 'warning' ? 'var(--color-warning)' : 'var(--color-brand-500)'}
                />

                <div className="budget-card__amounts">
                  <span className="budget-card__amounts-left">
                    Gastado: <MoneyDisplay amount={budget.spent} />
                  </span>
                  <span className="budget-card__amounts-right">
                    <MoneyDisplay amount={budget.amount} />
                  </span>
                </div>

                <div className="budget-card__actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/budgets/${budget.id}/edit`)}>
                    <Edit3 size={14} /> Editar
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => { if (window.confirm('¿Eliminar este presupuesto?')) deleteMutation.mutate(budget.id); }}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
