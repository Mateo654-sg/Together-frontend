import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Bell, CheckCircle, Circle, Trash2, Edit3, Clock } from 'lucide-react';
import { remindersApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { ErrorState } from '@/shared/components/ErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import type { Reminder } from '@/types/api';

export default function RemindersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCompleted, setShowCompleted] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reminders', showCompleted],
    queryFn: () => remindersApi.getAll({ completed: showCompleted ? undefined : false }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => remindersApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast('success', 'Recordatorio completado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remindersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast('success', 'Recordatorio eliminado');
    },
  });

  const reminders = data?.data || [];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isOverdue = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1>Recordatorios</h1>
        <button className="btn btn--primary" onClick={() => navigate('/reminders/new')}>
          <Plus size={16} /> Nuevo recordatorio
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        <button
          className={`chip ${!showCompleted ? 'chip--active' : ''}`}
          onClick={() => setShowCompleted(false)}
        >
          Pendientes
        </button>
        <button
          className={`chip ${showCompleted ? 'chip--active' : ''}`}
          onClick={() => setShowCompleted(true)}
        >
          Completados
        </button>
      </div>

      {isLoading ? (
        <SkeletonCard count={3} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={showCompleted ? 'Sin recordatorios completados' : 'Sin recordatorios pendientes'}
          message={showCompleted ? '' : 'Crea recordatorios para no olvidar pagos importantes.'}
          action={!showCompleted ? { label: 'Crear recordatorio', onClick: () => navigate('/reminders/new') } : undefined}
        />
      ) : (
        <div className="goals-grid">
          {reminders.map((reminder: Reminder) => {
            const overdue = !reminder.is_completed && isOverdue(reminder.due_date);
            return (
              <Card key={reminder.id} hover={false}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <button
                    onClick={() => completeMutation.mutate(reminder.id)}
                    disabled={reminder.is_completed || completeMutation.isPending}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, marginTop: 2,
                      color: reminder.is_completed ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}
                    title={reminder.is_completed ? 'Completado' : 'Marcar como completado'}
                  >
                    {reminder.is_completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{
                          fontSize: 'var(--text-base)', fontWeight: 600,
                          textDecoration: reminder.is_completed ? 'line-through' : 'none',
                          color: reminder.is_completed ? 'var(--color-text-muted)' : 'var(--color-text)',
                        }}>
                          {reminder.title}
                        </h3>
                        {reminder.description && (
                          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                            {reminder.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                        fontSize: 'var(--text-xs)',
                        color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
                      }}>
                        <Clock size={12} />
                        <span>{formatDate(reminder.due_date)}{overdue ? ' (Atrasado)' : ''}</span>
                      </div>

                      {reminder.repeat_type && reminder.repeat_type !== 'none' && (
                        <span style={{
                          padding: '1px var(--space-2)', borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-xs)', fontWeight: 600,
                          background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)',
                          textTransform: 'capitalize',
                        }}>
                          {reminder.repeat_type}
                        </span>
                      )}

                      {reminder.amount && Number(reminder.amount) > 0 && (
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                          <MoneyDisplay amount={Number(reminder.amount)} />
                        </span>
                      )}
                    </div>

                    {!reminder.is_completed && (
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/reminders/${reminder.id}/edit`)}>
                          <Edit3 size={14} /> Editar
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => { if (window.confirm('¿Eliminar este recordatorio?')) deleteMutation.mutate(reminder.id); }}
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    )}
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
