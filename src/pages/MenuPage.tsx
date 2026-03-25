import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import { LogOut, User, Tag, Tags, RefreshCw, Info, ChevronRight, Check, Loader, FileUp, Repeat, Bell, BellOff, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import api from '../lib/api';

declare const __APP_VERSION__: string;

export default function MenuPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { updateServiceWorker } = useRegisterSW();
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'updated' | 'latest'>('idle');
  const push = usePushNotifications();
  const [testSending, setTestSending] = useState(false);

  async function handleTestNotification() {
    setTestSending(true);
    try {
      await api.post('/push/test');
    } catch {}
    setTestSending(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleCheckUpdates() {
    setUpdateStatus('checking');
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.update();
        // Wait for the browser to detect a new SW
        await new Promise(r => setTimeout(r, 1500));
        if (reg.waiting) {
          await updateServiceWorker(true);
          setUpdateStatus('updated');
          setTimeout(() => window.location.reload(), 1500);
          return;
        }
      }
      setUpdateStatus('latest');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } catch {
      setUpdateStatus('latest');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  }

  const menuItems = [
    { icon: User, label: 'Editar Perfil', action: () => navigate('/profile') },
    { icon: Repeat, label: 'Recorrentes', action: () => navigate('/recurring') },
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

        {/* Push Notifications */}
        {push.supported && (
          <Card
            style={{ cursor: push.loading ? 'wait' : 'pointer' }}
            onClick={() => {
              if (push.loading) return;
              if (push.subscribed) push.unsubscribe();
              else push.subscribe();
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {push.subscribed ? (
                <Bell size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              ) : (
                <BellOff size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.875rem', display: 'block' }}>
                  {push.loading ? 'Configurando...' : push.subscribed ? 'Notificações ativadas' : 'Ativar notificações'}
                </span>
                {push.subscribed && (
                  <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                    Lembrete às segundas para importar extrato
                  </span>
                )}
                {push.permission === 'denied' && (
                  <span style={{ fontSize: '0.625rem', color: 'var(--color-danger)' }}>
                    Bloqueado pelo navegador. Permita nas configurações.
                  </span>
                )}
              </div>
              {push.subscribed ? (
                <Check size={16} style={{ color: 'var(--color-success)' }} />
              ) : (
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              )}
            </div>
          </Card>
        )}

        {push.subscribed && (
          <Card
            style={{ cursor: testSending ? 'wait' : 'pointer' }}
            onClick={testSending ? undefined : handleTestNotification}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Send size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', flex: 1 }}>
                {testSending ? 'Enviando...' : 'Enviar notificação de teste'}
              </span>
            </div>
          </Card>
        )}

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
