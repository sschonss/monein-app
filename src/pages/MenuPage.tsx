import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import { LogOut, User, Tag, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MenuPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Menu</h1>

      <Card style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{user?.name}</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{user?.email}</p>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Card style={{ cursor: 'pointer' }} onClick={() => navigate('/tags')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Tag size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.875rem' }}>Gerenciar Tags</span>
          </div>
        </Card>
        <Card style={{ cursor: 'pointer' }} onClick={() => navigate('/categories')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wallet size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.875rem' }}>Gerenciar Categorias</span>
          </div>
        </Card>
      </div>

      <button onClick={handleLogout} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: 'none',
        padding: '0.75rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', marginTop: '1rem',
      }}>
        <LogOut size={18} /> Sair
      </button>
    </div>
  );
}
