import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Users, DollarSign } from 'lucide-react';
import { sharedExpensesApi, couplesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth-store';
import type { SharedExpense, SharedIncome } from '@/types/api';

type Tab = 'expenses' | 'incomes' | 'balance';

export default function SharedFinancePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('expenses');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: couple } = useQuery({
    queryKey: ['couple-status'],
    queryFn: () => couplesApi.getStatus(),
  });

  const { data: expensesData, isLoading: expLoading, isError: expError, refetch: expRefetch } = useQuery({
    queryKey: ['shared-expenses'],
    queryFn: () => sharedExpensesApi.getAll(),
  });

  const { data: incomesData, isLoading: incLoading, isError: incError, refetch: incRefetch } = useQuery({
    queryKey: ['shared-incomes'],
    queryFn: () => sharedExpensesApi.getAllIncomes(),
  });

  const createExpenseMutation = useMutation({
    mutationFn: () => sharedExpensesApi.create({ amount: Number(amount), description, expense_date: date }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shared-expenses'] }); toast('success', 'Gasto compartido creado'); resetForm(); },
    onError: () => toast('error', 'Error al crear gasto compartido'),
  });

  const createIncomeMutation = useMutation({
    mutationFn: () => sharedExpensesApi.createIncome({ amount: Number(amount), description, income_date: date }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shared-incomes'] }); toast('success', 'Ingreso compartido creado'); resetForm(); },
    onError: () => toast('error', 'Error al crear ingreso compartido'),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => sharedExpensesApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shared-expenses'] }); toast('success', 'Gasto eliminado'); },
  });

  const resetForm = () => {
    setAmount(''); setDescription(''); setDate(new Date().toISOString().slice(0, 10)); setShowForm(false);
  };

  const expenses = expensesData?.data || [];
  const incomes = incomesData?.data || [];
  const totalExpenses = expenses.reduce((sum: number, e: SharedExpense) => sum + e.amount, 0);
  const totalIncomes = incomes.reduce((sum: number, i: SharedIncome) => sum + i.amount, 0);
  const balance = totalIncomes - totalExpenses;

  const isLinked = couple?.status === 'accepted';

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
    <div>
      <div className="dashboard-header">
        <h1>Finanzas Compartidas</h1>
        <button className="btn btn--primary" onClick={() => { setFormType('expense'); setShowForm(true); }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="goals-summary-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <Card hover={false}>
          <p className="summary-card__label">Gastos totales</p>
          <p className="summary-card__value" style={{ color: 'var(--color-danger)' }}>
            <MoneyDisplay amount={totalExpenses} />
          </p>
        </Card>
        <Card hover={false}>
          <p className="summary-card__label">Ingresos totales</p>
          <p className="summary-card__value" style={{ color: 'var(--color-success)' }}>
            <MoneyDisplay amount={totalIncomes} />
          </p>
        </Card>
        <Card hover={false}>
          <p className="summary-card__label">Balance</p>
          <p className="summary-card__value" style={{ color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            <MoneyDisplay amount={balance} />
          </p>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {(['expenses', 'incomes', 'balance'] as Tab[]).map((t) => (
          <button key={t} className={`chip ${tab === t ? 'chip--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'expenses' ? 'Gastos' : t === 'incomes' ? 'Ingresos' : 'Balance'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3>{formType === 'expense' ? 'Nuevo gasto compartido' : 'Nuevo ingreso compartido'}</h3>
            <button className="btn btn--ghost btn--sm" onClick={resetForm}><ArrowLeft size={16} /> Cancelar</button>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <button className={`chip ${formType === 'expense' ? 'chip--active' : ''}`} onClick={() => setFormType('expense')}>Gasto</button>
            <button className={`chip ${formType === 'income' ? 'chip--active' : ''}`} onClick={() => setFormType('income')}>Ingreso</button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (formType === 'expense') {
              createExpenseMutation.mutate();
            } else {
              createIncomeMutation.mutate();
            }
          }}>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Cena, alquiler" required />
            </div>
            <div className="form-group">
              <label className="form-label">Monto</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <button className="btn btn--primary" type="submit" disabled={createExpenseMutation.isPending || createIncomeMutation.isPending} style={{ marginTop: 'var(--space-3)' }}>
              <DollarSign size={16} /> {formType === 'expense' ? 'Crear gasto' : 'Crear ingreso'}
            </button>
          </form>
        </div>
      )}

      {tab === 'expenses' && (
        expLoading ? <SkeletonCard count={3} /> :
        expError ? <ErrorState onRetry={expRefetch} /> :
        expenses.length === 0 ? (
          <EmptyState icon={Users} title="Sin gastos compartidos" message="Agrega gastos que ambos compartan." />
        ) : (
          <div className="goals-grid">
            {expenses.map((expense: SharedExpense) => (
              <Card key={expense.id} hover={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{expense.description}</h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                      {new Date(expense.expense_date).toLocaleDateString('es')}
                      {expense.paid_by === user?.id ? ' · Pagado por ti' : ' · Pagado por tu pareja'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: 'var(--color-danger)', fontSize: 'var(--text-lg)' }}>
                      <MoneyDisplay amount={expense.amount} />
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      Tu mitad: <MoneyDisplay amount={expense.amount / 2} />
                    </p>
                  </div>
                </div>
                <button className="btn btn--ghost btn--sm" style={{ marginTop: 'var(--space-2)' }}
                  onClick={() => { if (window.confirm('¿Eliminar este gasto?')) deleteExpenseMutation.mutate(expense.id); }}>
                  <Trash2 size={14} /> Eliminar
                </button>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'incomes' && (
        incLoading ? <SkeletonCard count={3} /> :
        incError ? <ErrorState onRetry={incRefetch} /> :
        incomes.length === 0 ? (
          <EmptyState icon={Users} title="Sin ingresos compartidos" message="Agrega ingresos compartidos." />
        ) : (
          <div className="goals-grid">
            {incomes.map((income: SharedIncome) => (
              <Card key={income.id} hover={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{income.description}</h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                      {new Date(income.income_date).toLocaleDateString('es')}
                    </p>
                  </div>
                  <p style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 'var(--text-lg)' }}>
                    <MoneyDisplay amount={income.amount} />
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'balance' && (
        <div className="goals-grid">
          <Card hover={false}>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Resumen de balance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total gastado (ambos)</span>
                <span style={{ fontWeight: 600 }}><MoneyDisplay amount={totalExpenses} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tu mitad de gastos</span>
                <span style={{ fontWeight: 600 }}><MoneyDisplay amount={totalExpenses / 2} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total ingresado (ambos)</span>
                <span style={{ fontWeight: 600 }}><MoneyDisplay amount={totalIncomes} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tu mitad de ingresos</span>
                <span style={{ fontWeight: 600 }}><MoneyDisplay amount={totalIncomes / 2} /></span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-lg)' }}>
                <span style={{ fontWeight: 700 }}>Balance individual</span>
                <span style={{ fontWeight: 800, color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  <MoneyDisplay amount={balance} />
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
