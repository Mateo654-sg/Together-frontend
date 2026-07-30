import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { budgetsApi, categoriesApi } from '@/services/api';
import { useToast } from '@/shared/components/Toast';
import { SkeletonCard } from '@/shared/components/Skeleton';
import type { Category } from '@/types/api';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function BudgetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const { data: categories } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => categoriesApi.getAll('expense'),
  });

  const { data: existing } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => budgetsApi.getById(id!),
    enabled: isEdit,
  });

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (existing) {
      setAmount(String(existing.amount));
      setCategoryId(existing.category_id || '');
      setMonth(existing.month);
      setYear(existing.year);
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data: { amount: number; category_id?: string; month: number; year: number }) =>
      isEdit ? budgetsApi.update(id!, data) : budgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast('success', isEdit ? 'Presupuesto actualizado' : 'Presupuesto creado');
      navigate('/budgets');
    },
    onError: () => toast('error', 'Error al guardar el presupuesto'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { toast('error', 'Ingresa un monto válido'); return; }
    mutation.mutate({
      amount: Number(amount),
      category_id: categoryId || undefined,
      month,
      year,
    });
  };

  if (isEdit && !existing) return <SkeletonCard count={1} />;

  return (
    <div>
      <div className="dashboard-header">
        <button className="btn btn--ghost" onClick={() => navigate('/budgets')}>
          <ArrowLeft size={16} /> Volver
        </button>
        <h1>{isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h1>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">General</option>
              {(categories || []).map((c: Category) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Monto límite</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Mes</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Año</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={year - 2 + i} value={year - 2 + i}>{year - 2 + i}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn btn--primary" type="submit" disabled={mutation.isPending} style={{ marginTop: 'var(--space-4)' }}>
            <Save size={16} /> {mutation.isPending ? 'Guardando...' : (isEdit ? 'Actualizar presupuesto' : 'Crear presupuesto')}
          </button>
        </form>
      </div>
    </div>
  );
}
