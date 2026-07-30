import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Tag, ArrowLeft, Save } from 'lucide-react';
import { categoriesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import type { Category, CreateCategoryInput } from '@/types/api';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#6366f1');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['categories', typeFilter],
    queryFn: () => categoriesApi.getAll(typeFilter as 'expense' | 'income' | undefined),
  });

  const categories = data || [];

  const resetForm = () => {
    setName(''); setType('expense'); setIcon(''); setColor('#6366f1');
    setEditing(null); setShowForm(false);
  };

  const editCategory = (cat: Category) => {
    setName(cat.name);
    setType(cat.type as 'expense' | 'income');
    setIcon(cat.icon || '');
    setColor(cat.color || '#6366f1');
    setEditing(cat);
    setShowForm(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryInput) => categoriesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast('success', 'Categoría creada'); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryInput> }) => categoriesApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast('success', 'Categoría actualizada'); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast('success', 'Categoría eliminada'); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('error', 'El nombre es obligatorio'); return; }
    const payload = { name: name.trim(), type, icon: icon || undefined, color };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1>Categorías</h1>
        <button className="btn btn--primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        <button className={`chip ${typeFilter === undefined ? 'chip--active' : ''}`} onClick={() => setTypeFilter(undefined)}>Todas</button>
        <button className={`chip ${typeFilter === 'expense' ? 'chip--active' : ''}`} onClick={() => setTypeFilter('expense')}>Gastos</button>
        <button className={`chip ${typeFilter === 'income' ? 'chip--active' : ''}`} onClick={() => setTypeFilter('income')}>Ingresos</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', maxWidth: 640 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3>{editing ? 'Editar categoría' : 'Nueva categoría'}</h3>
            <button className="btn btn--ghost btn--sm" onClick={resetForm}><ArrowLeft size={16} /> Cancelar</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
                <label className="form-label">Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Comida" required />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value as 'expense' | 'income')}>
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">Ícono (emoji)</label>
                <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🛒" maxLength={5} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                <label className="form-label">Color</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: 40, padding: 4 }} />
              </div>
            </div>
            <button className="btn btn--primary" type="submit" disabled={createMutation.isPending || updateMutation.isPending} style={{ marginTop: 'var(--space-3)' }}>
              <Save size={16} /> {editing ? 'Actualizar' : 'Crear categoría'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <SkeletonCard count={3} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : categories.length === 0 ? (
        <EmptyState icon={Tag} title="Sin categorías" message="Crea categorías para organizar tus transacciones." />
      ) : (
        <div className="goals-grid">
          {categories.map((cat: Category) => (
            <Card key={cat.id} hover={false}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                  background: cat.color || 'var(--color-bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--text-lg)', flexShrink: 0,
                  color: 'white',
                }}>
                  {cat.icon || <Tag size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{cat.name}</h3>
                  <span style={{
                    padding: '1px var(--space-2)', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)', fontWeight: 600,
                    background: cat.type === 'expense' ? 'var(--color-danger-dim)' : 'var(--color-success-dim)',
                    color: cat.type === 'expense' ? 'var(--color-danger)' : 'var(--color-success)',
                  }}>
                    {cat.type === 'expense' ? 'Gasto' : 'Ingreso'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => editCategory(cat)}>
                    <Edit3 size={14} />
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm('¿Eliminar esta categoría?')) deleteMutation.mutate(cat.id); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
