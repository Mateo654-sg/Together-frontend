import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExpenseFormModal } from '@/features/expenses/components/ExpenseFormModal';

export default function ExpenseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    navigate(-1);
  };

  return <ExpenseFormModal open={open} onClose={close} context="personal" expenseId={id} />;
}
