import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import { LogOut, User, Tag, Tags, RefreshCw, Info, ChevronRight, Check, Loader, FileUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

declare const __APP_VERSION__: string;

export default function MenuPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { updateServiceWorker } = useRegisterSW();
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'updated' | 'latest'>('idle');

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleCheckUpdates() {
    setUpdateStatus('checking');
    try {
      await updateServiceWorker(true);
      setUpdateStatus('updated');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setUpdateStatus('latest');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  }

  const menuItems = [
    { icon: User, label: 'Editar Perfil', action: () => navigate('/profile') },
    { icon: Tag, label: 'Gerenciar Tags', action: () => navigate('/tags') },
    { icon: Tags, label: 'Gerenciar Categorias', action: () => navigate('/categories') },
    { icon: FileUp, label: 'Importar Extrato', action: () => navigate('/import') },
  ];

  const updateLabel = {
    idle: 'Verificar Atualizações',
    checking: 'Buscando atualizações...',
    updated: 'Atualização encontrada! Recarregando...',
    latest: 'Você já está na versão mais recente',
  }[updateStatus];

  const UpdateIcon = updateStatus === 'checking' ? Loader
    : updateStatus === 'latest' || updateStatus === 'updated' ? Check
    : RefreshCw;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100dvh - 80px)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Menu</h1>

      <Card style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={20} style={{ color: '#fff' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map(item => (
          <Card key={item.label} style={{ cursor: 'pointer' }} onClick={item.action}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <item.icon size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', flex: 1 }}>{item.label}</span>
              <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </Card>
        ))}

        <Card style={{ cursor: updateStatus === 'checking' ? 'wait' : 'pointer' }} onClick={updateStatus === 'idle' ? handleCheckUpdates : undefined}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UpdateIcon
              size={18}
              style={{
                color: updateStatus === 'latest' ? 'var(--color-success)' : updateStatus === 'updated' ? 'var(--color-success)' : 'var(--color-primary)',
                flexShrink: 0,
                animation: updateStatus === 'checking' ? 'spin 1s linear infinite' : undefined,
              }}
            />
            <span style={{
              fontSize: '0.875rem', flex: 1,
              color: updateStatus === 'latest' || updateStatus === 'updated' ? 'var(--color-success)' : undefined,
            }}>
              {updateLabel}
            </span>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Info size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', flex: 1 }}>Versão</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{__APP_VERSION__}</span>
          </div>
        </Card>
      </div>

      <div style={{ flex: 1 }} />

      <button onClick={handleLogout} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: 'none',
        padding: '0.75rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
      }}>
        <LogOut size={18} /> Sair
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--color-text-muted)', paddingBottom: '0.5rem' }}>
        Monein v{__APP_VERSION__}
      </p>
    </div>
  );
}
