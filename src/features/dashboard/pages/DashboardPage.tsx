import { useQuery } from '@tanstack/react-query';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank,
  ArrowRight, ArrowUpRight, Bell,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardApi } from '@/services/api/dashboard';
import { Card, CardGrid } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { formatRelative, formatCurrency, getInitials } from '@/shared/utils/format';
import { Link, useNavigate } from 'react-router-dom';

const CHART_COLORS = ['#FF4D8D', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
  });

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

  const activityData = data.statistics?.monthly_breakdown as Array<{ month: string; income: number; expense: number }> | undefined;
  const categoryStats = data.statistics?.top_categories as Array<{ category_name: string; total_amount: number }> | undefined;

  const greet = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {greet()}, {user?.first_name || 'Usuario'}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="dashboard-period">
          Últimos 30 días
        </div>
      </div>

      <CardGrid columns={4}>
        <Card>
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--savings"><Wallet size={20} /></div>
            <div className="stat-card__info">
              <div className="stat-card__label">Balance Neto</div>
              <div className="stat-card__value">
                <MoneyDisplay amount={data.balance} size="lg" color={data.balance >= 0 ? 'positive' : 'negative'} />
              </div>
              <div className={`stat-card__change ${data.cash_flow >= 0 ? 'stat-card__change--up' : 'stat-card__change--down'}`}>
                {data.cash_flow >= 0 ? '+' : ''}{formatCurrency(data.cash_flow)} este mes
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--income"><TrendingUp size={20} /></div>
            <div className="stat-card__info">
              <div className="stat-card__label">Ingresos</div>
              <div className="stat-card__value"><MoneyDisplay amount={data.income} size="lg" color="positive" /></div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--expense"><TrendingDown size={20} /></div>
            <div className="stat-card__info">
              <div className="stat-card__label">Gastos</div>
              <div className="stat-card__value"><MoneyDisplay amount={data.expense} size="lg" color="negative" /></div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--budget"><PiggyBank size={20} /></div>
            <div className="stat-card__info">
              <div className="stat-card__label">Ahorro</div>
              <div className="stat-card__value"><MoneyDisplay amount={data.saving} size="lg" color="primary" /></div>
            </div>
          </div>
        </Card>
      </CardGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
        <div className="chart-card">
          <div className="chart-title">Ingresos vs Gastos</div>
          <div className="chart-container">
            {activityData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} dot={false} name="Ingresos" />
                  <Line type="monotone" dataKey="expense" stroke="#FF4D8D" strokeWidth={2} dot={false} name="Gastos" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                No hay datos de tendencias aún
              </div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Categorías</div>
          <div className="chart-container">
            {categoryStats && categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="total_amount"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                  >
                    {categoryStats.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--color-text-primary)',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                No hay datos de categorías aún
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Actividad Reciente</h2>
            <Link to="/activity" className="section-link">
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>
          <Card hover={false}>
            {data.recent_activity.length === 0 ? (
              <EmptyState icon={Bell} title="Sin actividad reciente" message="Tus transacciones aparecerán aquí" />
            ) : (
              data.recent_activity.slice(0, 5).map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-item__dot" style={{
                    background: item.type === 'expense' ? 'var(--color-danger)' : 'var(--color-success)',
                  }} />
                  <div className="activity-item__info">
                    <div className="activity-item__title">{item.description}</div>
                    <div className="activity-item__date">{formatRelative(item.date)}</div>
                  </div>
                  <div className="activity-item__amount">
                    <MoneyDisplay
                      amount={item.amount}
                      size="sm"
                      color={item.type === 'expense' ? 'negative' : 'positive'}
                    />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Metas de Ahorro</h2>
            <Link to="/goals" className="section-link">
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>
          <Card hover={false}>
            {data.goals.length === 0 ? (
              <EmptyState icon={PiggyBank} title="Sin metas" message="Crea tu primera meta de ahorro" action={{ label: 'Crear meta', onClick: () => navigate('/goals') }} />
            ) : (
              data.goals.slice(0, 3).map((goal) => (
                <div key={goal.id} style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {goal.title}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {goal.progress_percentage ?? 0}%
                    </span>
                  </div>
                  <ProgressBar progress={goal.progress_percentage ?? 0} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <MoneyDisplay amount={goal.current_amount} size="sm" color="primary" />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      Meta: {formatCurrency(goal.target_amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
