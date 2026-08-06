import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Save, Tags } from 'lucide-react';
import { expensesApi, categoriesApi, tagsApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import type { Tag } from '@/types/api';

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => categoriesApi.getAll('expense'),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
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
      setSelectedTags((existing.tags ?? []).map((t: Tag) => t.id));
    }
  }, [existing]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const createTagMutation = useMutation({
    mutationFn: (name: string) => tagsApi.create({ name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

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
        ...(selectedTags.length > 0 && { tag_ids: selectedTags }),
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
          <label className="form-label">Etiquetas</label>
          {tags && tags.data.length > 0 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
              {tags.data.map((tag: Tag) => {
                const active = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`btn btn--sm ${active ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => toggleTag(tag.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Tags size={12} />
                    {tag.name}
                    {active && ' ✓'}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <input
              className="form-input"
              style={{ maxWidth: 240 }}
              placeholder="Nombre de la etiqueta"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={!newTagName.trim() || createTagMutation.isPending}
              onClick={() => {
                createTagMutation.mutate(newTagName.trim(), {
                  onSuccess: () => setNewTagName(''),
                });
              }}
            >
              <Tags size={14} /> {createTagMutation.isPending ? 'Creando...' : 'Crear etiqueta'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notas</label>
          <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." />
        </div>
      </Card>
    </div>
  );
}
