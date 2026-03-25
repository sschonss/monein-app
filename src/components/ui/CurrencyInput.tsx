import { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

function formatCurrency(cents: number): string {
  if (cents === 0) return '';
  const value = cents / 100;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCents(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  return parseInt(digits, 10) || 0;
}

export default function CurrencyInput({ value, onChange, placeholder = '0,00', required }: CurrencyInputProps) {
  const [display, setDisplay] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && !display) {
      const numVal = parseFloat(value);
      if (!isNaN(numVal) && numVal > 0) {
        setDisplay(formatCurrency(Math.round(numVal * 100)));
      }
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    const cents = parseInt(raw, 10) || 0;

    if (cents === 0) {
      setDisplay('');
      onChange('');
      return;
    }

    const formatted = formatCurrency(cents);
    setDisplay(formatted);
    onChange((cents / 100).toFixed(2));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && display) {
      e.preventDefault();
      const cents = parseCents(display);
      const newCents = Math.floor(cents / 10);

      if (newCents === 0) {
        setDisplay('');
        onChange('');
        return;
      }

      const formatted = formatCurrency(newCents);
      setDisplay(formatted);
      onChange((newCents / 100).toFixed(2));
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      required={required}
    />
  );
}
