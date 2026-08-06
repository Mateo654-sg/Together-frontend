import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, Clock, PiggyBank, Plus, Sparkles, Target, Trophy, Wallet, X,
} from 'lucide-react';
import { goalsApi, expensesApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { formatCurrency, formatDate, toFiniteNumber } from '@/shared/utils/format';
import { useNavigate } from 'react-router-dom';

import type { Goal } from '@/types/api';

type GoalFilter = 'active' | 'completed' | 'all';

const GOAL_ICONS = ['✈️', '🏠', '🚗', '💻', '🎓', '💍', '🌴', '🎯'];

function getProgress(goal: Goal) {
  const currentAmount = toFiniteNumber(goal.current_amount);
  const targetAmount = toFiniteNumber(goal.target_amount);
  const progress = goal.progress_percentage ?? (targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0);
  return Math.min(Math.max(Math.round(progress), 0), 100);
}

function getRemaining(goal: Goal) {
  return Math.max(toFiniteNumber(goal.target_amount) - toFiniteNumber(goal.current_amount), 0);
}

export default function GoalsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<GoalFilter>('active');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [amount, setAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getAll({ limit: 100 }),
  });

  const { data: balanceData } = useQuery({
    queryKey: ['expenses', 'balance'],
    queryFn: () => expensesApi.getBalance(),
  });

  const goals = useMemo<Goal[]>(() => data?.data ?? [], [data]);
  const availableBalance = balanceData?.balance ?? 0;

  const filtered = useMemo(() => {
    if (filter === 'all') return goals;
    return goals.filter((goal) => goal.status === filter);
  }, [filter, goals]);

  const summary = useMemo(() => {
    const active = goals.filter((goal) => goal.status === 'active');
    const completed = goals.filter((goal) => goal.status === 'completed');
    const nextGoal = [...active].sort((a, b) => getRemaining(a) - getRemaining(b))[0];

    return {
      active: active.length,
      completed: completed.length,
      totalSaved: goals.reduce((acc, goal) => acc + toFiniteNumber(goal.current_amount), 0),
      nextGoal,
    };
  }, [goals]);

  const parsedAmount = Number(amount);
  const amountError = useMemo(() => {
    if (!selectedGoal || amount === '') return '';
    if (!Number.isFinite(parsedAmount)) return 'Ingresa un monto válido.';
    if (parsedAmount <= 0) return 'El aporte debe ser mayor que cero.';
    if (parsedAmount > availableBalance) return 'No puedes aportar más que tu saldo disponible.';
    if (selectedGoal.status !== 'active') return 'Esta meta ya no está activa.';
    return '';
  }, [amount, availableBalance, parsedAmount, selectedGoal]);

  const contributeMutation = useMutation({
    mutationFn: () => goalsApi.contribute(selectedGoal!.id, parsedAmount, new Date().toISOString().split('T')[0]),
    onSuccess: async () => {
      const completed = selectedGoal ? toFiniteNumber(selectedGoal.current_amount) + parsedAmount >= toFiniteNumber(selectedGoal.target_amount) : false;
      setSuccessMessage(completed ? '¡Felicidades! Has completado tu meta de ahorro.' : 'Aporte registrado correctamente.');
      setSelectedGoal(null);
      setAmount('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses', 'balance'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      window.setTimeout(() => setSuccessMessage(''), 4200);
    },
  });

  const openContributionModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setAmount('');
  };

  if (isLoading) return (
    <div>
      <div className="dashboard-header"><h1>Metas de ahorro</h1></div>
      <SkeletonCard count={6} />
    </div>
  );

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="goals-screen">
      {successMessage && (
        <div className="goals-toast" role="status">
          <Trophy size={18} /> {successMessage}
        </div>
      )}

      <div className="goals-header">
        <div>
          <h1>Metas de ahorro</h1>
          <p>Administra y sigue el progreso de tus objetivos financieros.</p>
        </div>
        <button className="btn btn--primary" type="button" onClick={() => navigate('/goals/new')}>
          <Plus size={18} /> Nueva meta
        </button>
      </div>

      <div className="goals-summary-grid">
        <Card className="goals-summary-card">
          <div className="goals-summary-card__icon goals-summary-card__icon--active"><Target size={18} /></div>
          <span>Metas activas</span>
          <strong>{summary.active}</strong>
        </Card>
        <Card className="goals-summary-card">
          <div className="goals-summary-card__icon goals-summary-card__icon--saved"><Wallet size={18} /></div>
          <span>Total ahorrado</span>
          <MoneyDisplay amount={summary.totalSaved} size="lg" color="primary" />
        </Card>
        <Card className="goals-summary-card">
          <div className="goals-summary-card__icon goals-summary-card__icon--completed"><CheckCircle size={18} /></div>
          <span>Metas completadas</span>
          <strong>{summary.completed}</strong>
        </Card>
        <Card className="goals-summary-card goals-summary-card--next">
          <div className="goals-summary-card__icon goals-summary-card__icon--next"><Sparkles size={18} /></div>
          <span>Próxima meta</span>
          <strong>{summary.nextGoal ? summary.nextGoal.title : 'Sin metas activas'}</strong>
        </Card>
      </div>

      <div className="goals-toolbar">
        {(['active', 'completed', 'all'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`activity-chip ${filter === value ? 'activity-chip--active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {value === 'active' ? 'Activas' : value === 'completed' ? 'Completadas' : 'Todas'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card hover={false} className="goals-empty-card">
          <EmptyState
            icon={PiggyBank}
            title={filter === 'all' ? 'Todavía no tienes metas' : 'No hay metas en este estado'}
            message="Empieza creando tu primer objetivo financiero."
            action={{ label: 'Crear meta', onClick: () => navigate('/goals/new') }}
          />
        </Card>
      ) : (
        <div className="goals-grid">
          {filtered.map((goal, index) => {
            const progress = getProgress(goal);
            const remaining = getRemaining(goal);
            const completed = goal.status === 'completed';

            return (
              <Card key={goal.id} className={`goal-card ${completed ? 'goal-card--completed' : ''}`} hover>
                <div className="goal-card__header">
                  <div className="goal-card__icon" aria-hidden="true">{completed ? '🎉' : GOAL_ICONS[index % GOAL_ICONS.length]}</div>
                  <div className="goal-card__title-wrap">
                    <h2>{goal.title}</h2>
                    <span className={`goal-status goal-status--${goal.status}`}>
                      {completed ? <CheckCircle size={13} /> : <Clock size={13} />}
                      {completed ? 'Completada' : 'Activa'}
                    </span>
                  </div>
                </div>

                {goal.description && <p className="goal-card__description">{goal.description}</p>}

                <div className="goal-card__amounts">
                  <MoneyDisplay amount={goal.current_amount} size="md" color={completed ? 'positive' : 'primary'} />
                  <span>/ {formatCurrency(goal.target_amount)}</span>
                </div>

                <div className="goal-card__progress">
                  <div className="goal-card__progress-top">
                    <span>Progreso</span>
                    <strong>{progress}%</strong>
                  </div>
                  <ProgressBar progress={progress} height={9} />
                </div>

                <div className="goal-card__meta">
                  <span>Faltan {formatCurrency(remaining)}</span>
                  {goal.target_date && <span>Meta: {formatDate(goal.target_date)}</span>}
                </div>

                <div className="goal-card__actions">
                  <button
                    className="btn btn--primary btn--sm"
                    type="button"
                    onClick={() => openContributionModal(goal)}
                    disabled={completed}
                  >
                    Aportar
                  </button>
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => navigate(`/goals/${goal.id}`)}>
                    Ver detalle
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedGoal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedGoal(null)}>
          <div className="contribution-modal" role="dialog" aria-modal="true" aria-labelledby="contribution-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="contribution-modal__header">
              <div>
                <h2 id="contribution-title">Aportar a la meta</h2>
                <p>Meta: {selectedGoal.title}</p>
              </div>
              <button type="button" className="contribution-modal__close" onClick={() => setSelectedGoal(null)} aria-label="Cerrar modal">
                <X size={18} />
              </button>
            </div>

            <div className="contribution-modal__balance">
              <span>Saldo disponible</span>
              <MoneyDisplay amount={availableBalance} size="lg" color={availableBalance > 0 ? 'positive' : 'muted'} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contribution-amount">Monto a aportar</label>
              <input
                id="contribution-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                autoFocus
              />
              {amountError && <p className="form-error">{amountError}</p>}
              {contributeMutation.isError && <p className="form-error">No se pudo registrar el aporte. Revisa el monto e inténtalo de nuevo.</p>}
            </div>

            <div className="contribution-modal__actions">
              <button className="btn btn--secondary" type="button" onClick={() => setSelectedGoal(null)}>
                Cancelar
              </button>
              <button
                className="btn btn--primary"
                type="button"
                disabled={!amount || !!amountError || contributeMutation.isPending}
                onClick={() => contributeMutation.mutate()}
              >
                {contributeMutation.isPending ? <span className="btn__loader" /> : 'Aportar dinero'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
