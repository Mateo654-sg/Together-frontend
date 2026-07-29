import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Save } from 'lucide-react';
import { expensesApi, categoriesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';

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

export default function ExpenseFormPage() {
  const { id } = useParams();
  const editMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [location, setLocation] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => categoriesApi.getAll('expense'),
  });

  const { data: existing, isLoading, isError } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesApi.getById(id!),
    enabled: editMode,
  });

  useEffect(() => {
    if (existing) {
      setAmount(existing.amount.toString());
      setDescription(existing.description);
      setExpenseDate(existing.expense_date);
      setCategoryId(existing.category_id || '');
      setNotes(existing.notes || '');
      setPaymentMethod(PAYMENT_METHODS.includes(existing.payment_method as typeof PAYMENT_METHODS[number]) ? existing.payment_method || '' : '');
      setLocation(existing.location || '');
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        amount: parseFloat(amount) || 0,
        description,
        expense_date: expenseDate,
        ...(categoryId && { category_id: categoryId }),
        ...(notes && { notes }),
          payment_method: paymentMethod,
        ...(location && { location }),
      };
      return editMode
        ? expensesApi.update(id!, payload)
        : expensesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/activity');
    },
  });

  if (editMode && isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Editar Gasto</h1></div>
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
          disabled={!amount || !description || !paymentMethod || mutation.isPending}
        >
          <Save size={14} /> {mutation.isPending ? 'Guardando...' : editMode ? 'Actualizar' : 'Crear'}
        </button>
      </div>

      {mutation.isError && <ErrorState message="Error al guardar el gasto" />}

      <Card hover={false}>
        <div className="form-group">
          <label className="form-label">Descripción *</label>
          <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Supermercado" />
        </div>
        <div className="form-group">
          <label className="form-label">Monto *</label>
          <input className="form-input" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input className="form-input" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
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
          <label className="form-label">Método de pago</label>
          <div className="select-with-icon">
            <CreditCard size={16} />
            <select className="form-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
              <option value="">Selecciona un método de pago</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Ubicación</label>
          <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Tienda" />
        </div>
        <div className="form-group">
          <label className="form-label">Notas</label>
          <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." />
        </div>
      </Card>
    </div>
  );
}
