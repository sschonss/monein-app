import { useState, useEffect } from 'react';

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
}

function formatDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function displayToIso(display: string): string {
  const parts = display.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
}

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return '';
}

export default function DateInput({ value, onChange, required }: DateInputProps) {
  const [display, setDisplay] = useState(isoToDisplay(value));

  useEffect(() => {
    if (value && !display) {
      setDisplay(isoToDisplay(value));
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatDisplay(e.target.value);
    setDisplay(formatted);

    const iso = displayToIso(formatted);
    if (iso) {
      onChange(iso);
    }
  }

  function handleBlur() {
    const iso = displayToIso(display);
    if (!iso && display) {
      setDisplay(isoToDisplay(value));
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="DD/MM/AAAA"
      maxLength={10}
      required={required}
    />
  );
}
