import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { remindersApi } from '@/services/api';
import { useToast } from '@/shared/components/Toast';
import { SkeletonCard } from '@/shared/components/Skeleton';
import type { CreateReminderInput } from '@/types/api';

export default function ReminderFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const { data: existing } = useQuery({
    queryKey: ['reminder', id],
    queryFn: () => remindersApi.getById(id!),
    enabled: isEdit,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [repeatType, setRepeatType] = useState('none');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description || '');
      setDueDate(existing.due_date.slice(0, 10));
      setRepeatType(existing.repeat_type || 'none');
      setAmount(existing.amount || '');
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data: CreateReminderInput) =>
      isEdit ? remindersApi.update(id!, data) : remindersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast('success', isEdit ? 'Recordatorio actualizado' : 'Recordatorio creado');
      navigate('/reminders');
    },
    onError: () => toast('error', 'Error al guardar el recordatorio'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast('error', 'El título es obligatorio'); return; }
    if (!dueDate) { toast('error', 'La fecha de vencimiento es obligatoria'); return; }
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate,
      repeat_type: repeatType !== 'none' ? repeatType : undefined,
      amount: amount || undefined,
    });
  };

  if (isEdit && !existing) return <SkeletonCard count={1} />;

  return (
    <div>
      <div className="dashboard-header">
        <button className="btn btn--ghost" onClick={() => navigate('/reminders')}>
          <ArrowLeft size={16} /> Volver
        </button>
        <h1>{isEdit ? 'Editar recordatorio' : 'Nuevo recordatorio'}</h1>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Pago de luz" required />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fecha de vencimiento</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Repetir</label>
            <select value={repeatType} onChange={(e) => setRepeatType(e.target.value)}>
              <option value="none">No repetir</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Monto (opcional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <button className="btn btn--primary" type="submit" disabled={mutation.isPending} style={{ marginTop: 'var(--space-4)' }}>
            <Save size={16} /> {mutation.isPending ? 'Guardando...' : (isEdit ? 'Actualizar recordatorio' : 'Crear recordatorio')}
          </button>
        </form>
      </div>
    </div>
  );
}
