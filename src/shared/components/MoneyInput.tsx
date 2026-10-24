import { useRef } from 'react';

interface MoneyInputProps {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
}

function formatDisplay(raw: string): string {
  if (!raw) return '';
  const [intPart, decPart] = raw.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined ? `${formatted},${decPart}` : formatted;
}

function parseRaw(display: string): string {
  return display.replace(/\./g, '').replace(',', '.');
}

export function MoneyInput({ value, onChange, placeholder = '0', className, required, disabled, id, autoFocus }: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseRaw(e.target.value).replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    const clean = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : raw;
    onChange(clean);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      className={className ?? 'form-input'}
      value={formatDisplay(value)}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete="off"
      autoFocus={autoFocus}
    />
  );
}
