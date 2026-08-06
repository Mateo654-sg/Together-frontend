import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IncomeFormModal } from '@/features/incomes/components/IncomeFormModal';

export default function IncomeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    navigate(-1);
  };

  return <IncomeFormModal open={open} onClose={close} context="personal" incomeId={id} />;
}
