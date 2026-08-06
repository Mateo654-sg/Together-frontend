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
    <div>
      <div className="dashboard-header">
        <h1>Presupuestos</h1>
        <button className="btn btn--primary" onClick={() => navigate('/budgets/new')}>
          <Plus size={16} /> Nuevo presupuesto
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(Number(e.target.value))}
          style={{ width: 'auto', minWidth: 140 }}
        >
          {MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
          style={{ width: 'auto', minWidth: 100 }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={filterYear - 2 + i} value={filterYear - 2 + i}>{filterYear - 2 + i}</option>
          ))}
        </select>
      </div>

      {alerts.length > 0 && (
        <div style={{
          padding: 'var(--space-4)', marginBottom: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-warning-dim)',
          border: '1px solid var(--color-warning)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Alertas de presupuesto</span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {alerts.slice(0, 5).map((a, i) => (
              <li key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: 'var(--space-1) 0', fontSize: 'var(--text-sm)',
              }}>
                <span>Has consumido el {Math.round(a.percentage)}% (${toFiniteNumber(a.spent).toFixed(2)} de ${toFiniteNumber(a.amount).toFixed(2)})</span>
                <span style={{ fontWeight: 600, color: a.percentage >= 100 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
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
            const colors = level === 'danger'
              ? { bg: 'var(--color-danger-dim)', fg: 'var(--color-danger)', label: 'Excedido' }
              : level === 'warning'
              ? { bg: 'var(--color-warning-dim)', fg: 'var(--color-warning)', label: 'Alerta' }
              : { bg: 'var(--color-success-dim)', fg: 'var(--color-success)', label: 'OK' };
            return (
              <Card key={budget.id} hover={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                      {budget.category_id || 'General'}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                      {MONTHS[budget.month - 1]} {budget.year}
                    </p>
                  </div>
                  <span style={{
                    padding: '2px var(--space-2)', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)', fontWeight: 600,
                    background: colors.bg, color: colors.fg,
                  }}>
                    {colors.label}
                  </span>
                </div>

                <ProgressBar progress={pct} color={level === 'danger' ? 'var(--color-danger)' : level === 'warning' ? 'var(--color-warning)' : 'var(--color-brand-500)'} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    Gastado: <MoneyDisplay amount={budget.spent} />
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    <MoneyDisplay amount={budget.amount} />
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
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
