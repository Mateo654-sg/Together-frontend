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
    <div className="calendar-screen">
      <div className="page-header">
        <h1 className="page-header__title">Calendario</h1>
      </div>

      <Card hover={false}>
        <div className="calendar-nav">
          <button className="btn btn--ghost btn--sm" onClick={prevMonth}><ChevronLeft size={18} /></button>
          <h2>{MONTHS[month]} {year}</h2>
          <button className="btn btn--ghost btn--sm" onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>

        <div className="calendar-grid">
          {DAYS.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
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
                className={`calendar-day${isToday ? ' calendar-day--today' : ''}${isSelected ? ' calendar-day--selected' : ''}`}
                style={isSelected ? { background: 'var(--gradient-brand)', color: 'white' } : undefined}
              >
                <span className="calendar-day__num">{day}</span>
                {!events.isEmpty && (
                  <div style={{ display: 'flex', gap: '2px', marginTop: 2 }}>
                    {events.expenses.length > 0 && <TrendingDown size={10} style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-danger)' }} />}
                    {events.reminders.length > 0 && <Bell size={10} style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-warning)' }} />}
                    {events.goals.length > 0 && <Target size={10} style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-success)' }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDate && selectedEvents && (
        <Card hover={false}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', fontSize: 'var(--text-base)', textTransform: 'capitalize' }}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>

          {selectedEvents.expenses.map((e: Expense) => (
            <div key={e.id} className="list-item">
              <div className="list-item__dot" style={{ background: 'var(--color-danger)', boxShadow: '0 0 0 4px var(--color-danger-dim)' }} />
              <div className="list-item__info">
                <div className="list-item__title">{e.description}</div>
              </div>
              <MoneyDisplay amount={e.amount} size="sm" color="negative" />
            </div>
          ))}
          {selectedEvents.reminders.map((r: Reminder) => (
            <div key={r.id} className="list-item">
              <div className="list-item__dot" style={{ background: 'var(--color-warning)', boxShadow: '0 0 0 4px var(--color-warning-dim)' }} />
              <div className="list-item__info">
                <div className="list-item__title">{r.title}</div>
              </div>
              <Bell size={14} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            </div>
          ))}
          {selectedEvents.goals.map((g: Goal) => (
            <div key={g.id} className="list-item">
              <div className="list-item__dot" style={{ background: 'var(--color-success)', boxShadow: '0 0 0 4px var(--color-success-dim)' }} />
              <div className="list-item__info">
                <div className="list-item__title">Meta: {g.title}</div>
              </div>
              <MoneyDisplay amount={g.target_amount} size="sm" color="positive" />
            </div>
          ))}
          {selectedEvents.isEmpty && (
            <p className="list-item__date" style={{ padding: 'var(--space-2) 0' }}>Sin eventos este día</p>
          )}
        </Card>
      )}
    </div>
  );
}
