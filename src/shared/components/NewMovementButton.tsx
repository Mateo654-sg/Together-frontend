import { useEffect, useRef, useState } from 'react';
import { Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { ExpenseFormModal } from '@/features/expenses/components/ExpenseFormModal';
import { IncomeFormModal } from '@/features/incomes/components/IncomeFormModal';
import type { MovementContext } from '@/shared/utils/activity';

interface NewMovementButtonProps {
  context: MovementContext;
}

export function NewMovementButton({ context }: NewMovementButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<'expense' | 'income' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={menuRef} className="activity-new-menu">
      <button className="btn btn--primary" type="button" onClick={() => setMenuOpen((value) => !value)}>
        <Plus size={18} /> Nuevo movimiento
      </button>
      {menuOpen && (
        <div className="dropdown-menu">
          <button className="dropdown-item" type="button" onClick={() => { setMenuOpen(false); setModal('expense'); }}>
            <TrendingDown size={16} /> Nuevo gasto
          </button>
          <button className="dropdown-item" type="button" onClick={() => { setMenuOpen(false); setModal('income'); }}>
            <TrendingUp size={16} /> Nuevo ingreso
          </button>
        </div>
      )}
      <ExpenseFormModal open={modal === 'expense'} onClose={() => setModal(null)} context={context} />
      <IncomeFormModal open={modal === 'income'} onClose={() => setModal(null)} context={context} />
    </div>
  );
}
