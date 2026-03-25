import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import { LogOut, User, Tag, Tags, RefreshCw, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';

declare const __APP_VERSION__: string;

export default function MenuPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { updateServiceWorker } = useRegisterSW();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleCheckUpdates() {
    try {
      await updateServiceWorker(true);
    } catch {
      /* no update available */
    }
  }

  const menuItems = [
    { icon: User, label: 'Editar Perfil', action: () => navigate('/profile') },
    { icon: Tag, label: 'Gerenciar Tags', action: () => navigate('/tags') },
    { icon: Tags, label: 'Gerenciar Categorias', action: () => navigate('/categories') },
    { icon: RefreshCw, label: 'Verificar Atualizações', action: handleCheckUpdates },
  ];

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

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Info size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', flex: 1 }}>Versão</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{__APP_VERSION__}</span>
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
