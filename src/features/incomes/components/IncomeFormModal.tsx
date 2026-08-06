import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { categoriesApi, incomesApi, sharedExpensesApi } from '@/services/api';
import { Modal } from '@/shared/components/Modal';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
import type { MovementContext } from '@/shared/utils/activity';
import type { Income, SharedIncome } from '@/types/api';

interface IncomeFormModalProps {
  open: boolean;
  onClose: () => void;
  context: MovementContext;
  incomeId?: string;
}

export function IncomeFormModal({ open, onClose, context, incomeId }: IncomeFormModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const editMode = Boolean(incomeId);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories', 'income'],
    queryFn: () => categoriesApi.getAll('income'),
    enabled: context === 'personal',
  });

  const { data: existing, isLoading } = useQuery<Income | SharedIncome>({
    queryKey: context === 'personal' ? ['income', incomeId] : ['shared-income', incomeId],
    queryFn: () => (context === 'personal' ? incomesApi.getById(incomeId!) : sharedExpensesApi.getByIdIncome(incomeId!)),
    enabled: open && editMode,
  });

  useEffect(() => {
    if (!open) return;
    if (!editMode) {
      setAmount('');
      setDescription('');
      setIncomeDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setNotes('');
      return;
    }
    if (existing) {
      setAmount(existing.amount.toString());
      setDescription(existing.description);
      setIncomeDate(existing.income_date);
      setNotes(existing.notes || '');
      if (context === 'personal') {
        setCategoryId((existing as Income).category_id || '');
      }
    }
  }, [open, existing, editMode, context]);

  const mutation = useMutation<Income | SharedIncome, Error, void>({
    mutationFn: () => {
      const common = {
        amount: parseFloat(amount) || 0,
        description,
        income_date: incomeDate,
        ...(categoryId && { category_id: categoryId }),
        ...(notes && { notes }),
      };
      if (context === 'personal') {
        return editMode ? incomesApi.update(incomeId!, common) : incomesApi.create(common);
      }
      return editMode ? sharedExpensesApi.updateIncome(incomeId!, common) : sharedExpensesApi.createIncome(common);
    },
    onSuccess: () => {
      if (context === 'personal') {
        queryClient.invalidateQueries({ queryKey: ['incomes'] });
        queryClient.invalidateQueries({ queryKey: ['expenses', 'balance'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast('success', editMode ? 'Ingreso actualizado' : 'Ingreso creado');
      } else {
        queryClient.invalidateQueries({ queryKey: ['shared-incomes'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast('success', editMode ? 'Ingreso compartido actualizado' : 'Ingreso compartido creado');
      }
      onClose();
    },
    onError: () => toast('error', editMode ? 'Error al actualizar el ingreso' : 'Error al crear el ingreso'),
  });

  const title = editMode
    ? context === 'personal' ? 'Editar ingreso' : 'Editar ingreso compartido'
    : context === 'personal' ? 'Nuevo ingreso' : 'Nuevo ingreso compartido';

  const canSubmit = amount && description && !mutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title={title} size={context === 'personal' ? 'lg' : 'md'}>
      {editMode && isLoading ? (
        <SkeletonCard count={2} />
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
          {mutation.isError && <p className="form-error">Error al guardar el ingreso</p>}
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
          {context === 'personal' && (
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sin categoría</option>
                {categories?.map((c: { id: string; name: string; icon: string | null }) => (
                  <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." />
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
              <Save size={14} /> {mutation.isPending ? 'Guardando...' : editMode ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
