import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Target, Bell, TrendingDown } from 'lucide-react';
import { expensesApi, remindersApi } from '@/services/api';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { goalsApi } from '@/services/api';
import type { Expense, Reminder, Goal } from '@/types/api';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { data: expenses } = useQuery({
    queryKey: ['expenses', monthStr],
    queryFn: () => expensesApi.getAll(),
  });

  const { data: reminders } = useQuery({
    queryKey: ['reminders', 'all'],
    queryFn: () => remindersApi.getAll(),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getAll(),
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else { setMonth(m => m - 1); } setSelectedDate(null); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else { setMonth(m => m + 1); } setSelectedDate(null); };

  const dateKey = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getEventsForDay = (day: number) => {
    const key = dateKey(day);
    const dayExpenses = (expenses?.data || []).filter((e: Expense) => e.expense_date?.startsWith(key));
    const dayReminders = (reminders?.data || []).filter((r: Reminder) => r.due_date?.startsWith(key) && !r.is_completed);
    const dayGoals = (goals?.data || []).filter((g: Goal) => g.target_date?.startsWith(key));
    return { expenses: dayExpenses, reminders: dayReminders, goals: dayGoals, isEmpty: !dayExpenses.length && !dayReminders.length && !dayGoals.length };
  };

  const selectedEvents = selectedDate ? getEventsForDay(parseInt(selectedDate.split('-')[2])) : null;

  return (
    <div>
      <div className="dashboard-header">
        <h1>Calendario</h1>
      </div>

      <Card hover={false}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <button className="btn btn--ghost btn--sm" onClick={prevMonth}><ChevronLeft size={18} /></button>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{MONTHS[month]} {year}</h2>
          <button className="btn btn--ghost btn--sm" onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--space-1)', textAlign: 'center' }}>
          {DAYS.map(d => (
            <div key={d} style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', padding: 'var(--space-2) 0' }}>
              {d}
            </div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const key = dateKey(day);
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = selectedDate === key;
            const events = getEventsForDay(day);

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                style={{
                  background: isSelected ? 'var(--gradient-brand)' : isToday ? 'var(--color-bg-elevated)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--color-text)',
                  border: isToday && !isSelected ? '1px solid var(--color-border-default)' : 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-2) 0',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <span style={{ fontWeight: isToday || isSelected ? 700 : 400 }}>{day}</span>
                {!events.isEmpty && (
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {events.expenses.length > 0 && <TrendingDown size={10} style={{ color: 'var(--color-danger)' }} />}
                    {events.reminders.length > 0 && <Bell size={10} style={{ color: 'var(--color-warning)' }} />}
                    {events.goals.length > 0 && <Target size={10} style={{ color: 'var(--color-success)' }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDate && selectedEvents && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>
            {new Date(selectedDate).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>

          {selectedEvents.expenses.map((e: Expense) => (
            <div key={e.id} className="card" style={{ marginBottom: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <TrendingDown size={16} style={{ color: 'var(--color-danger)' }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{e.description}</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
                  <MoneyDisplay amount={e.amount} />
                </span>
              </div>
            </div>
          ))}
          {selectedEvents.reminders.map((r: Reminder) => (
            <div key={r.id} className="card" style={{ marginBottom: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Bell size={16} style={{ color: 'var(--color-warning)' }} />
                <span style={{ fontSize: 'var(--text-sm)' }}>{r.title}</span>
              </div>
            </div>
          ))}
          {selectedEvents.goals.map((g: Goal) => (
            <div key={g.id} className="card" style={{ marginBottom: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Target size={16} style={{ color: 'var(--color-success)' }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>Meta: {g.title}</span>
                </div>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  <MoneyDisplay amount={g.target_amount} />
                </span>
              </div>
            </div>
          ))}
          {selectedEvents.isEmpty && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Sin eventos este día</p>
          )}
        </div>
      )}
    </div>
  );
}
