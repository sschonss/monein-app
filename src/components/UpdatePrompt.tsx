import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  async function handleUpdate() {
    await updateServiceWorker(true);
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'center',
      padding: '0.75rem',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        maxWidth: '512px',
        width: '100%',
        background: 'var(--color-surface)',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--color-surface-3)',
      }}>
        <RefreshCw size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <p style={{ flex: 1, fontSize: '0.8125rem' }}>Nova versão disponível</p>
        <button
          onClick={handleUpdate}
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}
