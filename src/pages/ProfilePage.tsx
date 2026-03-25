import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Check, Lock, Trash2, User } from 'lucide-react';
import api from '../lib/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, fetchUser, logout } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('BRL');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setDefaultCurrency(user.default_currency || 'BRL');
    }
  }, [user]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    setProfileError('');
    try {
      await api.put('/profile', { name, email, default_currency: defaultCurrency });
      await fetchUser();
      setProfileMsg('Perfil atualizado com sucesso');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg('');
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      setPasswordLoading(false);
      return;
    }
    try {
      await api.put('/profile/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setPasswordMsg('Senha alterada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível.')) return;
    setDeleteLoading(true);
    try {
      await api.delete('/profile');
      await logout();
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir conta');
      setDeleteLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 500,
    marginBottom: '0.375rem',
    color: 'var(--color-text-muted)',
  };

  const msgStyle: React.CSSProperties = {
    padding: '0.625rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.8125rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Editar Perfil</h1>
      </div>

      {/* Section 1: Name & Email & Preferences */}
      <Card>
        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <User size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Dados Pessoais</span>
          </div>

          {profileMsg && (
            <div style={{ ...msgStyle, background: 'rgba(34,197,94,0.1)', color: 'var(--color-income)' }}>
              <Check size={14} /> {profileMsg}
            </div>
          )}
          {profileError && (
            <div style={{ ...msgStyle, background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>
              {profileError}
            </div>
          )}

          <div>
            <label style={labelStyle}>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div>
            <label style={labelStyle}>Moeda padrão</label>
            <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)}>
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <Button type="submit" fullWidth disabled={profileLoading}>
            {profileLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </Card>

      {/* Section 2: Change Password */}
      <Card>
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Lock size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Alterar Senha</span>
          </div>

          {passwordMsg && (
            <div style={{ ...msgStyle, background: 'rgba(34,197,94,0.1)', color: 'var(--color-income)' }}>
              <Check size={14} /> {passwordMsg}
            </div>
          )}
          {passwordError && (
            <div style={{ ...msgStyle, background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>
              {passwordError}
            </div>
          )}

          <div>
            <label style={labelStyle}>Senha atual</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Senha atual" required />
          </div>
          <div>
            <label style={labelStyle}>Nova senha</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha" required />
          </div>
          <div>
            <label style={labelStyle}>Confirmar nova senha</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" required />
          </div>

          <Button type="submit" fullWidth disabled={passwordLoading}>
            {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </form>
      </Card>

      {/* Section 3: Danger Zone */}
      <Card style={{ border: '1px solid var(--color-danger)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Trash2 size={16} style={{ color: 'var(--color-danger)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-danger)' }}>Zona de Perigo</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
        </p>
        <Button variant="danger" fullWidth onClick={handleDeleteAccount} disabled={deleteLoading}>
          {deleteLoading ? 'Excluindo...' : 'Excluir Conta'}
        </Button>
      </Card>
    </div>
  );
}
