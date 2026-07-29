import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, BarChart3, CalendarDays, Lightbulb, PiggyBank,
  Plus, Target, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi } from '@/services/api/dashboard';
import { Card, CardGrid } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { formatRelative, formatCurrency } from '@/shared/utils/format';

const CATEGORY_ICONS = ['🍔', '🚗', '🏠', '🛒', '💳'];

function greet() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getMovementIcon(type: string, description: string) {
  if (type === 'income') return '💵';
  const text = description.toLowerCase();
  if (text.includes('comida') || text.includes('restaurant') || text.includes('mcdonald')) return '🍔';
  if (text.includes('mercado') || text.includes('walmart') || text.includes('super')) return '🛒';
  if (text.includes('transporte') || text.includes('uber') || text.includes('taxi')) return '🚗';
  return '💳';
}

function getVariation(current: number, previous?: number) {
  if (previous === undefined) return { label: 'Sin datos previos', direction: 'neutral' as const };
  if (previous === 0 && current === 0) return { label: '0%', direction: 'neutral' as const };
  if (previous === 0) return { label: '+100%', direction: 'up' as const };

  const value = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(value);
  return {
    label: `${rounded > 0 ? '+' : ''}${rounded}%`,
    direction: rounded > 0 ? 'up' as const : rounded < 0 ? 'down' as const : 'neutral' as const,
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Dashboard</h1></div>
      <CardGrid columns={4}>
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </CardGrid>
      <SkeletonCard count={2} />
    </div>
  );

  if (isError) return <ErrorState onRetry={refetch} />;

  if (!data) return <EmptyState title="No hay datos del dashboard" />;

  const activityData = data.statistics?.monthly_breakdown ?? [];
  const categoryStats = data.statistics?.top_categories ?? [];
  const previousMonth = activityData.length > 1 ? activityData[activityData.length - 2] : undefined;
  const previousBalance = previousMonth ? previousMonth.income - previousMonth.expense : undefined;
  const previousSaving = previousMonth ? Math.max(previousMonth.income - previousMonth.expense, 0) : undefined;
  const savingsRate = data.income > 0 ? Math.round((data.saving / data.income) * 100) : 0;
  const topCategory = categoryStats[0];
  const topCategoryPercentage = topCategory?.percentage_of_total ?? 0;
  const period = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  const kpis = [
    {
      title: 'Balance Neto',
      amount: data.balance,
      icon: Wallet,
      iconClass: 'stat-card__icon--savings',
      color: data.balance >= 0 ? 'positive' as const : 'negative' as const,
      variation: getVariation(data.balance, previousBalance),
    },
    {
      title: 'Ingresos',
      amount: data.income,
      icon: TrendingUp,
      iconClass: 'stat-card__icon--income',
      color: 'positive' as const,
      variation: getVariation(data.income, previousMonth?.income),
    },
    {
      title: 'Gastos',
      amount: data.expense,
      icon: TrendingDown,
      iconClass: 'stat-card__icon--expense',
      color: 'negative' as const,
      variation: getVariation(data.expense, previousMonth?.expense),
    },
    {
      title: 'Ahorro',
      amount: data.saving,
      icon: PiggyBank,
      iconClass: 'stat-card__icon--budget',
      color: 'primary' as const,
      variation: getVariation(data.saving, previousSaving),
    },
  ];

  const insights = [
    topCategory ? `Tu mayor gasto fue ${topCategory.category_name}.` : 'Registra movimientos para identificar tu mayor gasto.',
    data.income > 0 ? `Ahorraste el ${savingsRate}% de tus ingresos.` : 'Agrega ingresos para medir tu capacidad de ahorro.',
    data.cash_flow >= 0 ? 'Vas mejor que el mes anterior.' : 'Tus gastos superaron el flujo del mes.',
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header__intro">
          <h1>{greet()}, {user?.first_name || 'Usuario'}</h1>
          <p>{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="dashboard-header__actions">
          <button className="dashboard-period" type="button">
            <CalendarDays size={16} /> {period} <span aria-hidden="true">▼</span>
          </button>
          <div ref={menuRef} className="activity-new-menu">
            <button className="btn btn--primary" type="button" onClick={() => setMenuOpen(!menuOpen)}>
              <Plus size={18} /> Nuevo movimiento
            </button>
            {menuOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/expenses/new'); }}>
                  <TrendingDown size={16} /> Nuevo gasto
                </button>
                <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/incomes/new'); }}>
                  <TrendingUp size={16} /> Nuevo ingreso
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardGrid columns={4}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="dashboard-kpi-card">
              <div className="stat-card">
                <div className={`stat-card__icon ${kpi.iconClass}`}><Icon size={20} /></div>
                <div className="stat-card__info">
                  <div className="stat-card__label">{kpi.title}</div>
                  <div className="stat-card__value"><MoneyDisplay amount={kpi.amount} size="lg" color={kpi.color} /></div>
                  <div className={`stat-card__change stat-card__change--${kpi.variation.direction}`}>
                    {kpi.variation.direction === 'up' ? '▲ ' : kpi.variation.direction === 'down' ? '▼ ' : ''}{kpi.variation.label}
                  </div>
                  <div className="stat-card__context">respecto al mes pasado</div>
                </div>
              </div>
            </Card>
          );
        })}
      </CardGrid>

      <div className="dashboard-main-grid">
        <Card hover={false} className="dashboard-panel dashboard-panel--chart">
          <div className="section-header">
            <h2 className="section-title">Ingresos vs Gastos</h2>
          </div>
          <div className="chart-container">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--color-text-primary)',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line type="monotone" dataKey="income" stroke="var(--color-success)" strokeWidth={2} dot={false} name="Ingresos" />
                  <Line type="monotone" dataKey="expense" stroke="var(--color-danger)" strokeWidth={2} dot={false} name="Gastos" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="Todavía no tienes movimientos" message="Registra tu primer ingreso o gasto para ver la tendencia." action={{ label: 'Agregar movimiento', onClick: () => navigate('/expenses/new') }} />
            )}
          </div>
        </Card>

        <Card hover={false} className="dashboard-panel">
          <div className="section-header">
            <h2 className="section-title">Actividad reciente</h2>
            <Link to="/activity" className="section-link">Ver todo <ArrowRight size={14} /></Link>
          </div>
          {data.recent_activity.length === 0 ? (
            <EmptyState icon={Wallet} title="Todavía no tienes actividad" message="Tus últimos ingresos y gastos aparecerán aquí." action={{ label: 'Agregar movimiento', onClick: () => navigate('/expenses/new') }} />
          ) : (
            <div className="activity-list">
              {data.recent_activity.slice(0, 5).map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-item__emoji" aria-hidden="true">{getMovementIcon(item.type, item.description)}</div>
                  <div className="activity-item__info">
                    <div className="activity-item__title">{item.description}</div>
                    <div className="activity-item__date">{formatRelative(item.date)}</div>
                  </div>
                  <div className="activity-item__amount">
                    <MoneyDisplay amount={item.amount} size="sm" color={item.type === 'expense' ? 'negative' : 'positive'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card hover={false} className="dashboard-panel">
          <div className="section-header">
            <h2 className="section-title">Categorías</h2>
          </div>
          {categoryStats.length === 0 ? (
            <EmptyState icon={BarChart3} title="Sin categorías todavía" message="Agrega movimientos para descubrir en qué gastas más." action={{ label: 'Agregar movimiento', onClick: () => navigate('/expenses/new') }} />
          ) : (
            <div className="category-list">
              {categoryStats.slice(0, 5).map((category, index) => {
                const percentage = Math.round(category.percentage_of_total ?? (topCategory?.total_amount ? (category.total_amount / topCategory.total_amount) * 100 : 0));
                return (
                  <div key={category.category_name} className="category-row">
                    <div className="category-row__top">
                      <span><span aria-hidden="true">{CATEGORY_ICONS[index % CATEGORY_ICONS.length]}</span> {category.category_name}</span>
                      <span>{percentage}%</span>
                    </div>
                    <ProgressBar progress={percentage} height={8} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card hover={false} className="dashboard-panel">
          <div className="section-header">
            <h2 className="section-title">Metas de ahorro</h2>
            <Link to="/goals" className="section-link">Ver todo <ArrowRight size={14} /></Link>
          </div>
          {data.goals.length === 0 ? (
            <EmptyState icon={Target} title="Aún no tienes metas" message="Define una meta para mantener tu ahorro visible." action={{ label: 'Crear meta', onClick: () => navigate('/goals/new') }} />
          ) : (
            <div className="goals-list">
              {data.goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="goal-row">
                  <div className="goal-row__header">
                    <span>{goal.title}</span>
                    <span>{Math.round(goal.progress_percentage ?? 0)}%</span>
                  </div>
                  <div className="goal-row__amounts">
                    <MoneyDisplay amount={goal.current_amount} size="sm" color="primary" />
                    <span>/ {formatCurrency(goal.target_amount)}</span>
                  </div>
                  <ProgressBar progress={goal.progress_percentage ?? 0} height={8} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card hover={false} className="dashboard-insights">
        <div className="dashboard-insights__icon"><Lightbulb size={20} /></div>
        <div>
          <h2 className="section-title">Insights financieros</h2>
          <div className="insight-list">
            {insights.map((insight) => <p key={insight}>💡 {insight}</p>)}
          </div>
        </div>
      </Card>
    </div>
  );
}
