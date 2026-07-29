import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { reportsApi } from '@/services/api';
import { Card, CardGrid } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';

const reportTypes = [
  { value: 'monthly', label: 'Mensual', icon: BarChart3 },
  { value: 'yearly', label: 'Anual', icon: TrendingUp },
  { value: 'category', label: 'Por categoría', icon: TrendingDown },
];

import type { Report } from '@/types/api';

export default function ReportsPage() {
  const [type, setType] = useState('monthly');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getAll(),
  });

  const reports: Report[] = data?.data ?? [];

  if (isLoading) return (
    <div><div className="dashboard-header"><h1>Reportes</h1></div><SkeletonCard count={3} /></div>
  );
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Reportes</h1>
        <button className="btn btn--primary btn--sm">
          <Download size={14} /> Generar Reporte
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {reportTypes.map((r) => (
          <button
            key={r.value}
            className={`btn btn--sm ${type === r.value ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setType(r.value)}
          >
            <r.icon size={14} /> {r.label}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <EmptyState icon={FileText} title="Sin reportes" message="Genera tu primer reporte financiero" />
      ) : (
        <CardGrid columns={2}>
          {reports.map((report: Report) => (
            <Card key={report.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                  Reporte {report.report_type}
                </h3>
                <span className={`btn btn--sm btn--ghost`} style={{ fontSize: 11 }}>
                  {report.status}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Formato: {report.format}
              </p>
            </Card>
          ))}
        </CardGrid>
      )}
    </div>
  );
}
