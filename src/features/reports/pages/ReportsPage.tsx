import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, CalendarRange, Download, FileSpreadsheet, FileText,
  TrendingDown, TrendingUp, Users, Wallet, Plus, Trash2, FileBarChart,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { exportsApi, downloadBlob, statisticsApi, couplesApi, reportsApi } from '@/services/api';
import { Card, CardGrid } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
import { formatCurrency, formatDate, toFiniteNumber } from '@/shared/utils/format';
import type { Report } from '@/types/api';

const tabs = [
  { value: 'monthly', label: 'Mensual', icon: BarChart3 },
  { value: 'yearly', label: 'Anual', icon: TrendingUp },
  { value: 'category', label: 'Por categoría', icon: TrendingDown },
  { value: 'couple', label: 'Pareja', icon: Users },
];

const exportFormats = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { value: 'csv', label: 'CSV', icon: FileText },
];

function KpiCard({ title, amount, color, icon }: {
  title: string; amount: number; color: 'positive' | 'negative' | 'primary'; icon: React.ReactNode;
}) {
  return (
    <Card>
      <div className="stat-card">
        <div className="stat-card__icon stat-card__icon--savings">{icon}</div>
        <div className="stat-card__info">
          <div className="stat-card__label">{title}</div>
          <div className="stat-card__value"><MoneyDisplay amount={amount} size="lg" color={color} /></div>
        </div>
      </div>
    </Card>
  );
}

function CategoryBreakdown({ items }: { items: Array<{ category_name: string; percentage_of_total: number; total_amount: number; transaction_count: number }> }) {
  if (items.length === 0) {
    return <EmptyState icon={BarChart3} title="Sin datos" message="Aún no hay movimientos en este periodo." />;
  }
  return (
    <div className="category-list">
      {items.map((category, index) => {
        const percentage = Math.round(toFiniteNumber(category.percentage_of_total));
        return (
          <div key={category.category_name + index} className="category-row">
            <div className="category-row__top">
              <span><span aria-hidden="true">{['🍔', '🚗', '🏠', '🛒', '💳'][index % 5]}</span> {category.category_name}</span>
              <span>{percentage}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <MoneyDisplay amount={category.total_amount} size="sm" />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{category.transaction_count} movimientos</span>
            </div>
            <ProgressBar progress={percentage} height={8} />
          </div>
        );
      })}
    </div>
  );
}

function MonthlyView() {
  const now = new Date();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['statistics-month'],
    queryFn: () => statisticsApi.getMonthly(now.getMonth() + 1, now.getFullYear()),
  });

  if (isLoading) return <CardGrid columns={3}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</CardGrid>;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <CardGrid columns={3}>
        <KpiCard title="Ingresos" amount={toFiniteNumber(data.total_income)} color="positive" icon={<TrendingUp size={20} />} />
        <KpiCard title="Gastos" amount={toFiniteNumber(data.total_expense)} color="negative" icon={<TrendingDown size={20} />} />
        <KpiCard title="Balance" amount={toFiniteNumber(data.balance)} color={toFiniteNumber(data.balance) >= 0 ? 'positive' : 'negative'} icon={<Wallet size={20} />} />
      </CardGrid>
      <Card hover={false}>
        <div className="section-header">
          <h2 className="section-title">Top categorías</h2>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Ahorro: {Math.round(toFiniteNumber(data.savings_rate))}%
          </span>
        </div>
        <CategoryBreakdown items={data.top_categories ?? []} />
      </Card>
    </div>
  );
}

function YearlyView() {
  const year = new Date().getFullYear();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['statistics-year'],
    queryFn: () => statisticsApi.getYearly(year),
  });

  if (isLoading) return <CardGrid columns={3}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</CardGrid>;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const breakdown = (data.monthly_breakdown ?? []).map((item) => ({
    ...item,
    name: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][item.month - 1] ?? item.month,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <CardGrid columns={3}>
        <KpiCard title="Ingresos" amount={toFiniteNumber(data.total_income)} color="positive" icon={<TrendingUp size={20} />} />
        <KpiCard title="Gastos" amount={toFiniteNumber(data.total_expense)} color="negative" icon={<TrendingDown size={20} />} />
        <KpiCard title="Balance" amount={toFiniteNumber(data.balance)} color={toFiniteNumber(data.balance) >= 0 ? 'positive' : 'negative'} icon={<Wallet size={20} />} />
      </CardGrid>
      <Card hover={false}>
        <div className="section-header">
          <h2 className="section-title">Ingresos vs Gastos</h2>
        </div>
        <div className="chart-container" style={{ height: 280 }}>
          {breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={breakdown} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-primary)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line type="monotone" dataKey="income" stroke="var(--color-success)" strokeWidth={2} dot={false} name="Ingresos" />
                <Line type="monotone" dataKey="expense" stroke="var(--color-danger)" strokeWidth={2} dot={false} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={BarChart3} title="Sin datos anuales" message="Registra movimientos para ver la tendencia anual." />
          )}
        </div>
      </Card>
      <Card hover={false}>
        <div className="section-header">
          <h2 className="section-title">Top categorías</h2>
        </div>
        <CategoryBreakdown items={data.top_categories ?? []} />
      </Card>
    </div>
  );
}

function CategoryView() {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const year = new Date().getFullYear();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['statistics-category', type],
    queryFn: () => statisticsApi.getCategory({ type, year }),
  });

  if (isLoading) return <SkeletonCard count={4} />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className={`btn btn--sm ${type === 'expense' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setType('expense')}>
          <TrendingDown size={14} /> Gastos
        </button>
        <button className={`btn btn--sm ${type === 'income' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setType('income')}>
          <TrendingUp size={14} /> Ingresos
        </button>
      </div>
      <Card hover={false}>
        <CategoryBreakdown items={data} />
      </Card>
    </div>
  );
}

function CoupleView() {
  const { data: couple } = useQuery({
    queryKey: ['couple-status'],
    queryFn: () => couplesApi.getStatus(),
  });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['statistics-couple'],
    queryFn: () => statisticsApi.getCouple(),
    enabled: couple?.status === 'accepted',
    retry: false,
  });

  if (couple && couple.status !== 'accepted') {
    return (
      <EmptyState
        icon={Users}
        title="Sin pareja vinculada"
        message="Vincula tu pareja para ver estadísticas compartidas."
      />
    );
  }
  if (isLoading) return <CardGrid columns={3}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</CardGrid>;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const contributions = Object.entries(data.partner_contribution ?? {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <CardGrid columns={3}>
        <KpiCard title="Ingresos totales" amount={toFiniteNumber(data.total_income)} color="positive" icon={<TrendingUp size={20} />} />
        <KpiCard title="Gastos totales" amount={toFiniteNumber(data.total_expense)} color="negative" icon={<TrendingDown size={20} />} />
        <KpiCard title="Balance" amount={toFiniteNumber(data.balance)} color={toFiniteNumber(data.balance) >= 0 ? 'positive' : 'negative'} icon={<Wallet size={20} />} />
      </CardGrid>
      <CardGrid columns={2}>
        <Card hover={false}>
          <div className="section-header"><h2 className="section-title">Personal</h2></div>
          <div className="stat-card">
            <div className="stat-card__info">
              <div className="stat-card__label">Ingresos</div>
              <div className="stat-card__value"><MoneyDisplay amount={toFiniteNumber(data.personal_income)} color="positive" /></div>
              <div className="stat-card__label" style={{ marginTop: 'var(--space-3)' }}>Gastos</div>
              <div className="stat-card__value"><MoneyDisplay amount={toFiniteNumber(data.personal_expense)} color="negative" /></div>
            </div>
          </div>
        </Card>
        <Card hover={false}>
          <div className="section-header"><h2 className="section-title">Compartido</h2></div>
          <div className="stat-card">
            <div className="stat-card__info">
              <div className="stat-card__label">Ingresos</div>
              <div className="stat-card__value"><MoneyDisplay amount={toFiniteNumber(data.shared_income)} color="positive" /></div>
              <div className="stat-card__label" style={{ marginTop: 'var(--space-3)' }}>Gastos</div>
              <div className="stat-card__value"><MoneyDisplay amount={toFiniteNumber(data.shared_expense)} color="negative" /></div>
            </div>
          </div>
        </Card>
      </CardGrid>
      {contributions.length > 0 && (
        <Card hover={false}>
          <div className="section-header">
            <h2 className="section-title">Aporte de cada uno</h2>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Ahorro: {Math.round(toFiniteNumber(data.savings_rate))}%
            </span>
          </div>
          <div className="category-list">
            {contributions.map(([name, amount]) => (
              <div key={name} className="category-row">
                <div className="category-row__top">
                  <span>{name}</span>
                  <MoneyDisplay amount={toFiniteNumber(amount)} size="sm" color={toFiniteNumber(amount) >= 0 ? 'positive' : 'negative'} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

const reportTypes = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'category', label: 'Por categoría' },
  { value: 'personal', label: 'Personal' },
  { value: 'couple', label: 'Pareja' },
];

const reportFormats = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { value: 'csv', label: 'CSV', icon: FileText },
];

function SavedReportsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [type, setType] = useState('monthly');
  const [format, setFormat] = useState('pdf');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports-list'],
    queryFn: () => reportsApi.getAll({ limit: 50 }),
  });

  const generateMutation = useMutation({
    mutationFn: () => reportsApi.create({ report_type: type, format: format as 'pdf' | 'excel' | 'csv', month, year }),
    onSuccess: () => {
      toast('success', 'Reporte generado correctamente');
      queryClient.invalidateQueries({ queryKey: ['reports-list'] });
    },
    onError: () => toast('error', 'Error al generar el reporte'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.remove(id),
    onSuccess: () => {
      toast('success', 'Reporte eliminado');
      queryClient.invalidateQueries({ queryKey: ['reports-list'] });
    },
    onError: () => toast('error', 'Error al eliminar el reporte'),
  });

  const reports = data?.data ?? [];

  return (
    <Card hover={false}>
      <div className="section-header">
        <h2 className="section-title">Generar y consultar reportes</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {reportTypes.map((t) => (
            <button
              key={t.value}
              className={`btn btn--sm ${type === t.value ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
            Formato
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {reportFormats.map((f) => (
                <button
                  key={f.value}
                  className={`btn btn--sm ${format === f.value ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => setFormat(f.value)}
                >
                  <f.icon size={14} /> {f.label}
                </button>
              ))}
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
            Mes
            <select className="form-input" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: 110 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
            Año
            <select className="form-input" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 110 }}>
              {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <button className="btn btn--primary btn--sm" disabled={generateMutation.isPending} onClick={() => generateMutation.mutate()}>
            <Plus size={14} /> {generateMutation.isPending ? 'Generando...' : 'Generar reporte'}
          </button>
        </div>

        <div>
          <div className="section-header">
            <h3 style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>Historial de reportes</h3>
          </div>
          {isLoading ? (
            <SkeletonCard count={2} />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : reports.length === 0 ? (
            <EmptyState icon={FileBarChart} title="Sin reportes guardados" message="Genera reportes para verlos aquí." />
          ) : (
            <div className="activity-list">
              {reports.map((report: Report) => {
                const typeLabel = reportTypes.find((t) => t.value === report.report_type)?.label ?? report.report_type;
                return (
                  <div key={report.id} className="activity-item">
                    <div className="activity-item__emoji" aria-hidden="true">
                      {report.format === 'excel' ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                    </div>
                    <div className="activity-item__info">
                      <div className="activity-item__title">
                        Reporte {typeLabel} · {report.format.toUpperCase()}
                      </div>
                      <div className="activity-item__date">
                        {report.generated_at ? formatDate(report.generated_at) : 'Pendiente'}
                        {' · '}{report.status}
                      </div>
                    </div>
                    <button
                      className="btn btn--ghost btn--sm"
                      title="Eliminar"
                      onClick={() => { if (window.confirm('¿Eliminar este reporte?')) deleteMutation.mutate(report.id); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ExportsSection() {  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['exports-history'],
    queryFn: () => exportsApi.list(),
  });
  const exportMutation = useMutation({
    mutationFn: ({ format, params }: { format: 'pdf' | 'excel' | 'csv'; params?: { date_from?: string; date_to?: string } }) =>
      exportsApi.exportFinances(format, params),
    onSuccess: ({ blob, filename }) => {
      downloadBlob(blob, filename);
      queryClient.invalidateQueries({ queryKey: ['exports-history'] });
    },
  });

  const records = history?.data ?? [];

  return (
    <Card hover={false}>
      <div className="section-header">
        <h2 className="section-title">Exportar finanzas</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
            Desde
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: 180 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
            Hasta
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: 180 }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {exportFormats.map((format) => (
            <button
              key={format.value}
              className="btn btn--primary btn--sm"
              disabled={exportMutation.isPending}
              onClick={() => exportMutation.mutate({
                format: format.value as 'pdf' | 'excel' | 'csv',
                params: {
                  ...(dateFrom ? { date_from: dateFrom } : {}),
                  ...(dateTo ? { date_to: dateTo } : {}),
                },
              })}
            >
              <format.icon size={14} />
              {exportMutation.isPending ? 'Generando...' : `Exportar ${format.label}`}
            </button>
          ))}
        </div>

        <div>
          <div className="section-header">
            <h3 style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>Historial de exportaciones</h3>
          </div>
          {records.length === 0 ? (
            <EmptyState icon={Download} title="Sin exportaciones" message="Los archivos que generes aparecerán aquí." />
          ) : (
            <div className="activity-list">
              {records.map((record) => (
                <div key={record.id} className="activity-item">
                  <div className="activity-item__emoji" aria-hidden="true">
                    {record.format === 'excel' ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="activity-item__info">
                    <div className="activity-item__title">Exportación {record.format.toUpperCase()}</div>
                    <div className="activity-item__date">
                      {formatDate(record.generated_at)}
                      {record.date_from && record.date_to ? ` · ${record.date_from} a ${record.date_to}` : ''}
                      {' · '}{Math.max(1, Math.round(record.file_size / 1024))} KB
                    </div>
                  </div>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => exportMutation.mutate({ format: record.format as 'pdf' | 'excel' | 'csv' })}
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {historyLoading && <SkeletonCard count={2} />}
        </div>
      </div>
    </Card>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('monthly');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Reportes y estadísticas</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Analiza tus finanzas y exporta tus movimientos</p>
        </div>
        <span className="btn btn--sm btn--ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <CalendarRange size={14} /> {new Date().getFullYear()}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.value}
            className={`btn btn--sm ${tab === t.value ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setTab(t.value)}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'monthly' && <MonthlyView />}
      {tab === 'yearly' && <YearlyView />}
      {tab === 'category' && <CategoryView />}
      {tab === 'couple' && <CoupleView />}

      <SavedReportsSection />
      <ExportsSection />
    </div>
  );
}
