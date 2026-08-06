import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit3, Trash2, Tag, ArrowLeft, Save,
  Utensils, Coffee, ShoppingCart, Car, Home, Zap, Wifi, Droplets,
  HeartPulse, Stethoscope, Dumbbell, Shirt, Scissors, GraduationCap,
  Clapperboard, Music, Tv, Gamepad2, Plane, PawPrint, PiggyBank,
  Banknote, Briefcase, Receipt, Gift, Smartphone, CreditCard,
  Beer, BottleWine, Cake, Salad, Apple, Pizza, Building2, Bus,
  Train, Landmark, Phone, Sparkles, ShoppingBasket, BookOpen, Lightbulb,
  Baby, Monitor, Laptop, Headphones, Hammer,
  type LucideIcon,
} from 'lucide-react';
import { categoriesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { FilterToolbar } from '@/shared/components/FilterToolbar';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import type { Category, CreateCategoryInput } from '@/types/api';

type TypeFilter = 'all' | 'expense' | 'income';

const EMOJI_ICONS: Record<string, LucideIcon> = {
  '🛒': ShoppingCart, '🛍': ShoppingBasket, '🍔': Utensils, '🍕': Pizza, '☕': Coffee,
  '🍺': Beer, '🍷': BottleWine, '🍰': Cake, '🍦': Cake, '🚗': Car, '🏠': Home,
  '💰': Banknote, '🏦': Landmark, '💳': CreditCard, '💊': HeartPulse, '🏥': Stethoscope,
  '🎓': GraduationCap, '📚': BookOpen, '✈': Plane, '🎬': Clapperboard, '🎵': Music,
  '📺': Tv, '👕': Shirt, '✂': Scissors, '🎁': Gift, '🐶': PawPrint, '🐱': PawPrint,
  '🏋': Dumbbell, '⚽': Dumbbell, '💪': Dumbbell, '📱': Smartphone, '💻': Laptop,
  '📞': Phone, '🔌': Wifi, '💡': Lightbulb, '🔥': Sparkles, '🎉': Sparkles,
  '🌮': Utensils, '🍜': Utensils, '🥗': Salad, '🍎': Apple, '🧾': Receipt,
  '💸': Banknote, '🏢': Building2, '👶': Baby, '💇': Scissors, '🚌': Bus, '🚇': Train,
  '🌍': Plane, '🖥': Monitor, '🎧': Headphones, '🔧': Hammer, '💼': Briefcase,
};

const CATEGORY_ICON_RULES: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ['postre', 'dulce', 'helado', 'pastel', 'torta', 'chocolate'], icon: Cake },
  { keywords: ['cerveza', 'licor', 'vino', 'bar', 'fiesta'], icon: Beer },
  { keywords: ['café', 'cafe', 'desayuno rápido'], icon: Coffee },
  { keywords: ['pizza', 'hamburguesa', 'fast food', 'comida rápida'], icon: Pizza },
  { keywords: ['fruta', 'verdura', 'verduras', 'vegetal', 'saludable', 'ensalada'], icon: Salad },
  { keywords: ['comida', 'restaurante', 'cena', 'almuerzo', 'desayuno', 'menú', 'menu', 'delivery', 'superman', 'almuerzos'], icon: Utensils },
  { keywords: ['mercado', 'supermercado', 'super', 'despensa', 'alimentos', 'víveres', 'viveres', 'abarrote', 'mandado'], icon: ShoppingCart },
  { keywords: ['internet', 'wifi', 'streaming', 'suscripción', 'suscripcion', 'netflix', 'spotify'], icon: Wifi },
  { keywords: ['agua', 'acueducto', 'alcantarillado'], icon: Droplets },
  { keywords: ['luz', 'electricidad', 'energía', 'energia', 'servicios públicos', 'servicios publicos'], icon: Zap },
  { keywords: ['tarjeta', 'crédito', 'credito', 'préstamo', 'prestamo', 'deuda', 'financiación', 'financiacion'], icon: CreditCard },
  { keywords: ['transporte', 'uber', 'taxi', 'gasolina', 'combustible', 'parqueadero', 'estacionamiento', 'peaje', 'bus', 'metro', 'buseta', 'carro', 'auto', 'vehículo', 'vehiculo', 'moto', 'bicicleta', 'gas'], icon: Car },
  { keywords: ['gimnasio', 'deporte', 'entrenamiento', 'fitness', 'crossfit', 'yoga'], icon: Dumbbell },
  { keywords: ['salud', 'médico', 'medico', 'doctor', 'farmacia', 'medicina', 'medicamento', 'hospital', 'clínica', 'clinica', 'dental', 'seguro médico', 'seguro medico', 'psicolog'], icon: HeartPulse },
  { keywords: ['ropa', 'zapatos', 'vestido', 'jeans', 'camisa', 'moda', 'outfit', 'prendas'], icon: Shirt },
  { keywords: ['pelo', 'peluquería', 'peluqueria', 'belleza', 'cosmético', 'cosmetico', 'maquillaje', 'uñas', 'unas', 'barber'], icon: Scissors },
  { keywords: ['educación', 'educacion', 'colegio', 'universidad', 'curso', 'matrícula', 'matricula', 'escuela', 'libros', 'estudio', 'academia'], icon: GraduationCap },
  { keywords: ['cine', 'película', 'pelicula', 'concierto', 'evento', 'teatro', 'festival'], icon: Clapperboard },
  { keywords: ['música', 'musica', 'concierto', 'instrumento'], icon: Music },
  { keywords: ['juego', 'videojuego', 'gaming', 'consola', 'playstation', 'xbox', 'nintendo'], icon: Gamepad2 },
  { keywords: ['viaje', 'vuelo', 'avión', 'avion', 'hotel', 'vacaciones', 'turismo', 'reserva', 'aeropuerto', 'tiquete', 'boleto'], icon: Plane },
  { keywords: ['mascota', 'perro', 'gato', 'veterinaria', 'petshop', 'mascotas'], icon: PawPrint },
  { keywords: ['ahorro', 'inversión', 'inversion', 'fondos', 'cuenta ahorro', 'finanzas'], icon: PiggyBank },
  { keywords: ['salario', 'sueldo', 'nómina', 'nomina', 'bono', 'bonificación', 'bonificacion', 'quincena'], icon: Banknote },
  { keywords: ['negocio', 'freelance', 'honorarios', 'trabajo', 'empresa', 'contrato'], icon: Briefcase },
  { keywords: ['venta', 'ventas', 'ecommerce', 'tienda', 'marketplace'], icon: ShoppingBasket },
  { keywords: ['impuesto', 'impuestos', 'iva', 'seguro'], icon: Receipt },
  { keywords: ['regalo', 'cumpleaños', 'cumpleanos', 'detalle', 'obsequio', 'navidad', 'aniversario', 'san valentín', 'san valentin'], icon: Gift },
  { keywords: ['tecnología', 'tecnologia', 'electrónica', 'electronica', 'computador', 'computador', 'laptop', 'celular', 'teléfono', 'telefono', 'gadget'], icon: Smartphone },
  { keywords: ['arriendo', 'alquiler', 'renta', 'casa', 'hogar', 'vivienda', 'apartamento', 'hipoteca', 'condominio'], icon: Home },
  { keywords: ['oficina', 'trabajo', 'oficinas'], icon: Building2 },
  { keywords: ['estudio', 'cursos'], icon: BookOpen },
];

function normalizeEmoji(emoji: string): string {
  return (emoji || '').replace(/[\uFE0F\u200D]/g, '').trim();
}

function getCategoryIcon(category: Category): LucideIcon {
  const fromEmoji = EMOJI_ICONS[normalizeEmoji(category.icon || '')];
  if (fromEmoji) return fromEmoji;

  const name = (category.name || '').toLowerCase();
  for (const rule of CATEGORY_ICON_RULES) {
    if (rule.keywords.some((k) => name.includes(k))) return rule.icon;
  }
  return Tag;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#6366f1');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['categories', typeFilter],
    queryFn: () => categoriesApi.getAll(typeFilter === 'all' ? undefined : typeFilter),
  });

  const filteredCategories = useMemo(() => {
    const base = data || [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? base.filter((cat) => cat.name.toLowerCase().includes(q))
      : base;
    return [...filtered].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [data, search, sortOrder]);

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

      <FilterToolbar
        filters={[
          { key: 'all', label: 'Todas', showChevron: true },
          { key: 'income', label: 'Ingresos' },
          { key: 'expense', label: 'Gastos' },
        ]}
        activeFilter={typeFilter}
        onFilterChange={(key) => setTypeFilter(key as TypeFilter)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar categorías..."
        ariaLabel="Filtros de categorías"
        sortLabel={sortOrder === 'asc' ? 'A–Z' : 'Z–A'}
        onSortClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        onFilterClick={() => { setTypeFilter('all'); setSearch(''); }}
      />

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
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={search ? 'Sin resultados' : 'Sin categorías'}
          message={search ? 'Prueba con otro término o limpia la búsqueda.' : 'Crea categorías para organizar tus transacciones.'}
          action={search ? { label: 'Limpiar búsqueda', onClick: () => setSearch('') } : undefined}
        />
      ) : (
        <div className="goals-grid">
          {filteredCategories.map((cat: Category) => {
            const CategoryIcon = getCategoryIcon(cat);
            return (
              <Card key={cat.id} hover={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                    background: cat.color || 'var(--color-bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    color: 'white',
                  }}>
                    <CategoryIcon size={20} />
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
            );
          })}
        </div>
      )}
    </div>
  );
}
