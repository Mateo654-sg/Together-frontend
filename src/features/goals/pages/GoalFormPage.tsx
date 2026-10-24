import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { goalsApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { MoneyInput } from '@/shared/components/MoneyInput';

export default function GoalFormPage() {
  const { id } = useParams();
  const editMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const { data: existing, isLoading, isError } = useQuery({
    queryKey: ['goal', id],
    queryFn: () => goalsApi.getById(id!),
    enabled: editMode,
  });

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description || '');
      setTargetAmount(existing.target_amount.toString());
      setTargetDate(existing.target_date || '');
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        ...(description && { description }),
        target_amount: parseFloat(targetAmount),
        ...(targetDate && { target_date: targetDate }),
      };
      return editMode
        ? goalsApi.update(id!, payload)
        : goalsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/goals');
    },
  });

  if (editMode && isLoading) return (
    <div>
      <div className="page-header"><h1 className="page-header__title">Editar Meta</h1></div>
      <SkeletonCard count={2} />
    </div>
  );
  if (editMode && isError) return <ErrorState />;

  return (
    <div>
      <div className="page-header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="page-header__actions">
          <button
            className="btn btn--primary btn--sm"
            onClick={() => mutation.mutate()}
            disabled={!title || !targetAmount || mutation.isPending}
          >
            <Save size={14} /> {mutation.isPending ? 'Guardando...' : editMode ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>

      {mutation.isError && <ErrorState message="Error al guardar la meta" />}

      <Card hover={false}>
        <div className="form-group">
          <label className="form-label">Título *</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Viaje a Europa" />
        </div>
        <div className="form-group">
          <label className="form-label">Monto objetivo *</label>
          <MoneyInput value={targetAmount} onChange={setTargetAmount} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha objetivo</label>
          <input className="form-input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea className="form-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe tu meta..." />
        </div>
      </Card>
    </div>
  );
}
