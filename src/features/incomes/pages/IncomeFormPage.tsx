import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { incomesApi, categoriesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';

export default function IncomeFormPage() {
  const { id } = useParams();
  const editMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories', 'income'],
    queryFn: () => categoriesApi.getAll('income'),
  });

  const { data: existing, isLoading, isError } = useQuery({
    queryKey: ['income', id],
    queryFn: () => incomesApi.getById(id!),
    enabled: editMode,
  });

  useEffect(() => {
    if (existing) {
      setAmount(existing.amount.toString());
      setDescription(existing.description);
      setIncomeDate(existing.income_date);
      setCategoryId(existing.category_id || '');
      setNotes(existing.notes || '');
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        amount: parseFloat(amount),
        description,
        income_date: incomeDate,
        ...(categoryId && { category_id: categoryId }),
        ...(notes && { notes }),
      };
      return editMode
        ? incomesApi.update(id!, payload)
        : incomesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/activity');
    },
  });

  if (editMode && isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Editar Ingreso</h1></div>
      <SkeletonCard count={2} />
    </div>
  );
  if (editMode && isError) return <ErrorState />;

  return (
    <div>
      <div className="dashboard-header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>
        <button
          className="btn btn--primary btn--sm"
          onClick={() => mutation.mutate()}
          disabled={!amount || !description || mutation.isPending}
        >
          <Save size={14} /> {mutation.isPending ? 'Guardando...' : editMode ? 'Actualizar' : 'Crear'}
        </button>
      </div>

      {mutation.isError && <ErrorState message="Error al guardar el ingreso" />}

      <Card hover={false}>
        <div className="form-group">
          <label className="form-label">Descripción *</label>
          <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Salario" />
        </div>
        <div className="form-group">
          <label className="form-label">Monto *</label>
          <input className="form-input" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input className="form-input" type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sin categoría</option>
            {categories?.map((c: { id: string; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notas</label>
          <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." />
        </div>
      </Card>
    </div>
  );
}
