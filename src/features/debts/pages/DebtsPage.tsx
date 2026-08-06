import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, CheckCircle, Copy, UserPlus } from 'lucide-react';
import { debtsApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { toFiniteNumber } from '@/shared/utils/format';
import type { Debt } from '@/types/api';

export default function DebtsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: debtsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['debts'],
    queryFn: () => debtsApi.getAll(),
  });

  const { data: balanceData } = useQuery({
    queryKey: ['debt-balance'],
    queryFn: () => debtsApi.getBalance(),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => debtsApi.pay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt-balance'] });
      toast('success', 'Deuda marcada como pagada');
    },
  });

  const copyDebtData = (debt: Debt) => {
    const text = `Deuda: ${debt.description || 'Gasto compartido'}\nMonto: $${toFiniteNumber(debt.amount).toFixed(2)}\nEstado: ${debt.status}`;
    navigator.clipboard.writeText(text).then(() => {
      toast('success', 'Datos copiados al portapapeles');
    }).catch(() => {
      toast('error', 'No se pudo copiar');
    });
  };

  const debts = debtsData || [];
  const totalPending = debts.reduce((sum: number, d: Debt) => sum + toFiniteNumber(d.amount), 0);
  const totalSharedExpenses = balanceData?.total_shared_expenses ?? 0;
  const coupleBalance = balanceData?.balance ?? 0;

  return (
    <div>
      <div className="dashboard-header">
        <h1>Deudas</h1>
      </div>

      <div className="goals-summary-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <Card hover={false}>
          <p className="summary-card__label">Total pendiente</p>
          <p className="summary-card__value" style={{ color: 'var(--color-danger)' }}>
            <MoneyDisplay amount={totalPending} />
          </p>
        </Card>
        <Card hover={false}>
          <p className="summary-card__label">Gastos compartidos</p>
          <p className="summary-card__value">
            <MoneyDisplay amount={totalSharedExpenses} />
          </p>
        </Card>
        <Card hover={false}>
          <p className="summary-card__label">Balance de pareja</p>
          <p className="summary-card__value" style={{ color: coupleBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            <MoneyDisplay amount={coupleBalance} />
          </p>
        </Card>
      </div>

      {isLoading ? (
        <SkeletonCard count={3} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : debts.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Sin deudas"
          message="Las deudas compartidas aparecerán aquí automáticamente."
        />
      ) : (
        <div className="goals-grid">
          {debts.map((debt: Debt) => {
            const isPending = debt.status === 'pending';
            return (
              <Card key={debt.id} hover={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                    {debt.description || 'Gasto compartido'}
                  </h3>
                  <span style={{
                    padding: '2px var(--space-2)', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)', fontWeight: 600,
                    background: isPending ? 'var(--color-warning-dim)' : 'var(--color-success-dim)',
                    color: isPending ? 'var(--color-warning)' : 'var(--color-success)',
                  }}>
                    {isPending ? 'Pendiente' : debt.status === 'paid' ? 'Pagada' : 'Cancelada'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'var(--space-3)' }}>
                  <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                    <MoneyDisplay amount={debt.amount} />
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    {isPending && (
                      <button className="btn btn--primary btn--sm" onClick={() => payMutation.mutate(debt.id)} disabled={payMutation.isPending}>
                        <CheckCircle size={14} /> Pagar
                      </button>
                    )}
                    <button className="btn btn--ghost btn--sm" onClick={() => copyDebtData(debt)} title="Copiar datos">
                      <Copy size={14} />
                    </button>
                    {isPending && (
                      <button className="btn btn--secondary btn--sm" onClick={() => {
                        const text = `${debt.description || 'Gasto compartido'} $${toFiniteNumber(debt.amount).toFixed(2)}`;
                        navigator.clipboard.writeText(text).then(() => toast('success', 'Listo para pagar con Nequi'));
                      }}>
                        <UserPlus size={14} /> Nequi
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
