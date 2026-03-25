import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export default function Button({ variant = 'primary', fullWidth, children, style, ...props }: ButtonProps) {
  const variants = {
    primary: { background: 'var(--color-primary)', color: '#fff' },
    secondary: { background: 'var(--color-surface-2)', color: 'var(--color-text)' },
    danger: { background: 'var(--color-danger)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--color-text-muted)' },
  };

  return (
    <button
      style={{
        ...variants[variant],
        border: 'none',
        borderRadius: '0.5rem',
        padding: '0.625rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        width: fullWidth ? '100%' : undefined,
        opacity: props.disabled ? 0.5 : 1,
        transition: 'opacity 0.2s',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
