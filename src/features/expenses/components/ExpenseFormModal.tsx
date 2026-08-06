import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Save, Tags, MapPin, Camera, Loader2, X } from 'lucide-react';
import { categoriesApi, expensesApi, sharedExpensesApi, tagsApi, uploadApi } from '@/services/api';
import { Modal } from '@/shared/components/Modal';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
import { getFriendlyLocation, captureImageFile, vibrate } from '@/pwa/device';
import type { MovementContext } from '@/shared/utils/activity';
import type { Expense, SharedExpense, Tag } from '@/types/api';

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

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  context: MovementContext;
  expenseId?: string;
}

export function ExpenseFormModal({ open, onClose, context, expenseId }: ExpenseFormModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const editMode = Boolean(expenseId);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [attachment, setAttachment] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => categoriesApi.getAll('expense'),
    enabled: context === 'personal',
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
    enabled: context === 'personal',
  });

  const { data: existing, isLoading } = useQuery<Expense | SharedExpense>({
    queryKey: context === 'personal' ? ['expense', expenseId] : ['shared-expense', expenseId],
    queryFn: () => (context === 'personal' ? expensesApi.getById(expenseId!) : sharedExpensesApi.getById(expenseId!)),
    enabled: open && editMode,
  });

  useEffect(() => {
    if (!open) return;
    if (!editMode) {
      setAmount('');
      setDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setNotes('');
      setPaymentMethod('');
      setLocation('');
      setSelectedTags([]);
      setNewTagName('');
      setAttachment('');
      return;
    }
    if (existing) {
      setAmount(existing.amount.toString());
      setDescription(existing.description);
      setExpenseDate(existing.expense_date);
      setCategoryId(existing.category_id || '');
      setNotes(existing.notes || '');
      if (context === 'personal') {
        const item = existing as Expense;
        setPaymentMethod(
          PAYMENT_METHODS.includes(item.payment_method as typeof PAYMENT_METHODS[number]) ? item.payment_method || '' : ''
        );
        setLocation(item.location || '');
        setAttachment(item.attachment_url || '');
        setSelectedTags((item.tags ?? []).map((t: Tag) => t.id));
      }
    }
  }, [open, existing, editMode, context]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleGeolocate = async () => {
    if (geolocating) return;
    setGeolocating(true);
    try {
      const label = await getFriendlyLocation();
      setLocation(label);
      vibrate(30);
    } catch {
      toast('error', 'No se pudo obtener tu ubicación. Revisa los permisos de GPS.');
    } finally {
      setGeolocating(false);
    }
  };

  const handleAttachPhoto = async () => {
    if (attaching) return;
    try {
      const file = await captureImageFile();
      setAttaching(true);
      const { url } = await uploadApi.uploadImage(file);
      setAttachment(url);
      vibrate(30);
    } catch (error) {
      const message = error instanceof Error && error.message.includes('cancelada')
        ? ''
        : 'No se pudo adjuntar la imagen.';
      if (message) toast('error', message);
    } finally {
      setAttaching(false);
    }
  };

  const createTagMutation = useMutation({
    mutationFn: (name: string) => tagsApi.create({ name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  const mutation = useMutation<Expense | SharedExpense, Error, void>({
    mutationFn: () => {
      const common = {
        amount: parseFloat(amount) || 0,
        description,
        expense_date: expenseDate,
        ...(categoryId && { category_id: categoryId }),
        ...(notes && { notes }),
      };
      if (context === 'personal') {
        const payload = {
          ...common,
          payment_method: paymentMethod,
          ...(location && { location }),
          ...(attachment && { attachment_url: attachment }),
          ...(selectedTags.length > 0 && { tag_ids: selectedTags }),
        };
        return editMode ? expensesApi.update(expenseId!, payload) : expensesApi.create(payload);
      }
      return editMode ? sharedExpensesApi.update(expenseId!, common) : sharedExpensesApi.create(common);
    },
    onSuccess: () => {
      if (context === 'personal') {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['expenses', 'balance'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast('success', editMode ? 'Gasto actualizado' : 'Gasto creado');
      } else {
        queryClient.invalidateQueries({ queryKey: ['shared-expenses'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast('success', editMode ? 'Gasto compartido actualizado' : 'Gasto compartido creado');
      }
      onClose();
    },
    onError: () => toast('error', editMode ? 'Error al actualizar el gasto' : 'Error al crear el gasto'),
  });

  const title = editMode
    ? context === 'personal' ? 'Editar gasto' : 'Editar gasto compartido'
    : context === 'personal' ? 'Nuevo gasto' : 'Nuevo gasto compartido';

  const canSubmit = amount && description && (context === 'personal' ? paymentMethod : true) && !mutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title={title} size={context === 'personal' ? 'lg' : 'md'}>
      {editMode && isLoading ? (
        <SkeletonCard count={2} />
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
          {mutation.isError && <p className="form-error">Error al guardar el gasto</p>}
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
          {context === 'personal' && (
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
          )}
          {context === 'personal' && (
            <div className="form-group">
              <label className="form-label">Ubicación</label>
              <div className="device-field">
                <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Tienda" />
                <button
                  type="button"
                  className="btn btn--secondary btn--sm device-field__btn"
                  onClick={handleGeolocate}
                  disabled={geolocating}
                >
                  {geolocating ? <Loader2 size={14} className="spin" /> : <MapPin size={14} />}
                  {geolocating ? 'Ubicando...' : 'GPS'}
                </button>
              </div>
            </div>
          )}
          {context === 'personal' && (
            <div className="form-group">
              <label className="form-label">Recibo / Foto</label>
              {attachment ? (
                <div className="attachment">
                  <img src={attachment} alt="Adjunto del gasto" className="attachment__img" />
                  <button
                    type="button"
                    className="attachment__remove"
                    onClick={() => setAttachment('')}
                    aria-label="Quitar imagen"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn--secondary btn--sm" onClick={handleAttachPhoto} disabled={attaching}>
                  {attaching ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
                  {attaching ? 'Subiendo...' : 'Tomar foto / adjuntar'}
                </button>
              )}
            </div>
          )}
          {context === 'personal' && (
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
