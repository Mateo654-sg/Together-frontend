import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { transfersApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { useToast } from '@/shared/components/Toast';
import { formatDate, toFiniteNumber } from '@/shared/utils/format';
import type { Transfer } from '@/types/api';

const PAYMENT_METHODS = [
  'Efectivo',
  'Nequi',
  'Nu',
  'Bancolombia',
  'Davivienda',
  'BBVA',
  'Banco de Bogotá',
  'Caja Social',
  'Banco AV Villas',
  'Banco Popular',
  'Colpatria',
  'PSE',
  'Tarjeta Débito',
  'Tarjeta Crédito',
  'Otro',
] as const;

type FormState = {
  fromMethod: string;
  toMethod: string;
  amount: string;
  description: string;
  transferDate: string;
};

const EMPTY_FORM: FormState = {
  fromMethod: '',
  toMethod: '',
  amount: '',
  description: '',
  transferDate: new Date().toISOString().split('T')[0],
};

export default function TransfersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transfer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => transfersApi.getAll({ limit: 100 }),
  });

  useEffect(() => {
    if (editing) {
      setForm({
        fromMethod: editing.from_method,
        toMethod: editing.to_method,
        amount: editing.amount.toString(),
        description: editing.description ?? '',
        transferDate: editing.transfer_date,
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
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        from_method: form.fromMethod,
        to_method: form.toMethod,
        amount: parseFloat(form.amount) || 0,
        description: form.description || undefined,
        transfer_date: form.transferDate,
      };
      return editing
        ? transfersApi.update(editing.id, payload)
        : transfersApi.create(payload);
    },
    onSuccess: () => {
      toast('success', editing ? 'Transferencia actualizada' : 'Transferencia creada');
      invalidate();
      resetForm();
    },
    onError: () => toast('error', 'Error al guardar la transferencia'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transfersApi.remove(id),
    onSuccess: () => {
      toast('success', 'Transferencia eliminada');
      invalidate();
    },
    onError: () => toast('error', 'Error al eliminar la transferencia'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fromMethod === form.toMethod) {
      toast('error', 'El método de origen y destino deben ser distintos');
      return;
    }
    saveMutation.mutate();
  };

  const transfers = data?.data ?? [];
  const total = transfers.reduce((sum: number, t: Transfer) => sum + toFiniteNumber(t.amount), 0);

  return (
    <div className="activity-screen">
      <div className="activity-header">
        <div>
          <h1>Transferencias</h1>
          <p>Mueve dinero entre tus métodos de pago.</p>
        </div>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(!showForm); }}
        >
          <Plus size={18} /> Nueva transferencia
        </button>
      </div>

      <div className="goals-summary-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <Card hover={false}>
          <p className="summary-card__label">Transferencias</p>
          <p className="summary-card__value">{transfers.length}</p>
        </Card>
        <Card hover={false}>
          <p className="summary-card__label">Total transferido</p>
          <p className="summary-card__value">
            <MoneyDisplay amount={total} />
          </p>
        </Card>
      </div>

      {showForm && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
        <Card hover={false}>
          <div className="section-header">
            <h3>{editing ? 'Editar transferencia' : 'Nueva transferencia'}</h3>
            <button className="btn btn--ghost btn--sm" type="button" onClick={resetForm}>Cancelar</button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Desde *</label>
                <select className="form-input" value={form.fromMethod} onChange={(e) => setForm({ ...form, fromMethod: e.target.value })} required>
                  <option value="">Selecciona el método de origen</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hacia *</label>
                <select className="form-input" value={form.toMethod} onChange={(e) => setForm({ ...form, toMethod: e.target.value })} required>
                  <option value="">Selecciona el método de destino</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Monto *</label>
                <input className="form-input" type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input className="form-input" type="date" value={form.transferDate} onChange={(e) => setForm({ ...form, transferDate: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Ahorro mensual" />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn--primary" type="submit" disabled={saveMutation.isPending}>
                <Save size={14} /> {saveMutation.isPending ? 'Guardando...' : editing ? 'Actualizar' : 'Crear transferencia'}
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
      ) : transfers.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Sin transferencias"
          message="Registra movimientos entre tus métodos de pago."
          action={{ label: 'Nueva transferencia', onClick: () => setShowForm(true) }}
        />
      ) : (
        <Card hover={false}>
          <div className="activity-list">
            {transfers.map((t) => (
              <div key={t.id} className="activity-row">
                <div className="activity-row__icon" aria-hidden="true"><ArrowLeftRight size={18} /></div>
                <div className="activity-row__main">
                  <div className="activity-row__title">
                    {t.from_method} → {t.to_method}
                    {t.description ? ` · ${t.description}` : ''}
                  </div>
                  <div className="activity-row__meta">
                    <span>{formatDate(t.transfer_date)}</span>
                  </div>
                </div>
                <div className="activity-row__amount">
                  <MoneyDisplay amount={toFiniteNumber(t.amount)} size="md" />
                </div>
                <div className="activity-row__actions">
                  <button type="button" title="Editar" onClick={() => setEditing(t)}><Edit2 size={14} /></button>
                  <button type="button" title="Eliminar" onClick={() => { if (window.confirm('¿Eliminar esta transferencia?')) deleteMutation.mutate(t.id); }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
