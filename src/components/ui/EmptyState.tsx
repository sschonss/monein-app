import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: '0.75rem' }}>
      <Icon size={48} strokeWidth={1} style={{ color: 'var(--color-text-muted)' }} />
      <p style={{ fontWeight: 600, fontSize: '1rem' }}>{title}</p>
      {description && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>{description}</p>}
    </div>
  );
}
