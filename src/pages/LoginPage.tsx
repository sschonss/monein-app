import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { Wallet } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Wallet size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Monein</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Suas finanças sob controle</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" fullWidth disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Não tem conta? <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
