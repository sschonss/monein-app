import { ReactNode } from 'react';

export default function Card({ children, style, ...props }: { children: ReactNode; style?: React.CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: '0.75rem',
      padding: '1rem',
      ...style,
    }} {...props}>
      {children}
    </div>
  );
}
