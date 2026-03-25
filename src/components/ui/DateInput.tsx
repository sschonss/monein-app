interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
}

export default function DateInput({ value, onChange, required }: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      style={{ cursor: 'pointer' }}
    />
  );
}
