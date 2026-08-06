import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Plus, Trash2, Edit2, Save, Repeat, TrendingDown, TrendingUp } from 'lucide-react';
import { recurringApi, categoriesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { useToast } from '@/shared/components/Toast';
import { formatDate, toFiniteNumber } from '@/shared/utils/format';
import type { RecurringTransaction } from '@/types/api';

const FREQUENCIES = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual' },
] as const;

type FormState = {
  type: 'expense' | 'income';
  frequency: 'daily' | 'weekly' | 'monthly' | 'annual';
  amount: string;
  description: string;
  categoryId: string;
  nextExecution: string;
};

const EMPTY_FORM: FormState = {
  type: 'expense',
  frequency: 'monthly',
  amount: '',
  description: '',
  categoryId: '',
  nextExecution: new Date().toISOString().split('T')[0],
};

export default function RecurringPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => recurringApi.getAll({ limit: 100 }),
  });

  const { data: expenseCategories } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => categoriesApi.getAll('expense'),
  });

  const { data: incomeCategories } = useQuery({
    queryKey: ['categories', 'income'],
    queryFn: () => categoriesApi.getAll('income'),
  });

  useEffect(() => {
    if (editing) {
      setForm({
        type: editing.type,
        frequency: editing.frequency,
        amount: editing.amount.toString(),
        description: editing.description,
        categoryId: editing.category_id ?? '',
        nextExecution: editing.next_execution,
      });
      setShowForm(true);
    }
  }, [editing]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['recurring'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        type: form.type,
        frequency: form.frequency,
        amount: parseFloat(form.amount) || 0,
        description: form.description,
        ...(form.categoryId ? { category_id: form.categoryId } : {}),
        next_execution: form.nextExecution,
      };
      return editing
        ? recurringApi.update(editing.id, payload)
        : recurringApi.create(payload);
    },
    onSuccess: () => {
      toast('success', editing ? 'Movimiento recurrente actualizado' : 'Movimiento recurrente creado');
      invalidate();
      resetForm();
    },
    onError: () => toast('error', 'Error al guardar el movimiento recurrente'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringApi.remove(id),
    onSuccess: () => {
      toast('success', 'Movimiento recurrente eliminado');
      invalidate();
    },
    onError: () => toast('error', 'Error al eliminar el movimiento recurrente'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => recurringApi.update(id, { active }),
    onSuccess: () => {
      toast('success', 'Estado actualizado');
      invalidate();
    },
    onError: () => toast('error', 'Error al actualizar el estado'),
  });

  const processMutation = useMutation({
    mutationFn: () => recurringApi.processDue(),
    onSuccess: (result) => {
      toast('success', `${result.executed} movimiento(s) recurrente(s) materializado(s)`);
      invalidate();
    },
    onError: () => toast('error', 'Error al procesar los movimientos vencidos'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast('error', 'Ingresa una descripción');
      return;
    }
    saveMutation.mutate();
  };

  const recurring = data?.data ?? [];
  const activeCount = recurring.filter((r) => r.active).length;
  const categories = form.type === 'expense' ? (expenseCategories ?? []) : (incomeCategories ?? []);

  return (
    <div className="activity-screen">
      <div className="activity-header">
        <div>
          <h1>Movimientos recurrentes</h1>
          <p>Automatiza tus gastos e ingresos periódicos.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            className="btn btn--secondary"
            type="button"
            disabled={processMutation.isPending}
            onClick={() => processMutation.mutate()}
          >
            <RefreshCw size={16} /> {processMutation.isPending ? 'Procesando...' : 'Procesar vencidos'}
          </button>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(!showForm); }}
          >
            <Plus size={18} /> Nuevo recurrente
          </button>
        </div>
      </div>

      <div className="goals-summary-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <Card hover={false}>
          <p className="summary-card__label">Recurrentes</p>
          <p className="summary-card__value">{recurring.length}</p>
        </Card>
        <Card hover={false}>
          <p className="summary-card__label">Activos</p>
          <p className="summary-card__value">{activeCount}</p>
        </Card>
      </div>

      {showForm && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
        <Card hover={false}>
          <div className="section-header">
            <h3>{editing ? 'Editar recurrente' : 'Nuevo recurrente'}</h3>
            <button className="btn btn--ghost btn--sm" type="button" onClick={resetForm}>Cancelar</button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {(['expense', 'income'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`btn btn--sm ${form.type === type ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => setForm({ ...form, type, categoryId: '' })}
                >
                  {type === 'expense' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  {type === 'expense' ? 'Gasto' : 'Ingreso'}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Frecuencia *</label>
                <select className="form-input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as FormState['frequency'] })} required>
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monto *</label>
                <input className="form-input" type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label className="form-label">Próxima ejecución</label>
                <input className="form-input" type="date" value={form.nextExecution} onChange={(e) => setForm({ ...form, nextExecution: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción *</label>
              <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Arriendo mensual" required />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn--primary" type="submit" disabled={saveMutation.isPending}>
                <Save size={14} /> {saveMutation.isPending ? 'Guardando...' : editing ? 'Actualizar' : 'Crear recurrente'}
              </button>
            </div>
          </form>
        </Card>
        </div>
      )}

      {isLoading ? (
        <SkeletonCard count={3} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : recurring.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Sin movimientos recurrentes"
          message="Crea recurrencias para automatizar tus pagos e ingresos."
          action={{ label: 'Nuevo recurrente', onClick: () => setShowForm(true) }}
        />
      ) : (
        <Card hover={false}>
          <div className="activity-list">
            {recurring.map((r) => {
              const frequencyLabel = FREQUENCIES.find((f) => f.value === r.frequency)?.label ?? r.frequency;
              return (
                <div key={r.id} className="activity-row">
                  <div className="activity-row__icon" aria-hidden="true">
                    {r.type === 'expense' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                  </div>
                  <div className="activity-row__main">
                    <div className="activity-row__title">
                      {r.description}
                      <span className={`activity-chip ${r.active ? 'activity-chip--active' : ''}`} style={{ marginLeft: 8 }}>
                        {r.active ? 'Activo' : 'Pausado'}
                      </span>
                    </div>
                    <div className="activity-row__meta">
                      <span>{frequencyLabel}</span>
                      <span>Próxima: {formatDate(r.next_execution)}</span>
                    </div>
                  </div>
                  <div className="activity-row__amount">
                    <MoneyDisplay amount={toFiniteNumber(r.amount)} size="md" color={r.type === 'expense' ? 'negative' : 'positive'} />
                  </div>
                  <div className="activity-row__actions">
                    <button type="button" title={r.active ? 'Pausar' : 'Activar'} onClick={() => toggleMutation.mutate({ id: r.id, active: !r.active })}>
                      <RefreshCw size={14} />
                    </button>
                    <button type="button" title="Editar" onClick={() => setEditing(r)}><Edit2 size={14} /></button>
                    <button type="button" title="Eliminar" onClick={() => { if (window.confirm('¿Eliminar este movimiento recurrente?')) deleteMutation.mutate(r.id); }}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
