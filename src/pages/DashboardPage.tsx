import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import { TrendingUp, TrendingDown, Landmark, Wallet, ChevronRight, BarChart3 } from 'lucide-react';
import api from '../lib/api';

interface DashboardData {
  balance: number;
  total_income: number;
  total_expense: number;
  total_investment: number;
}

const periods = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
  { key: 'all', label: 'Tudo' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [investSummary, setInvestSummary] = useState<{ total_balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/dashboard', { params: { period } }),
      api.get('/investments/summary'),
    ]).then(([dashRes, investRes]) => {
      setData(dashRes.data);
      setInvestSummary(investRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const balance = data?.balance ?? 0;
  const isPositive = balance >= 0;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Olá, {user?.name?.split(' ')[0]}</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>Dashboard</h1>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)} style={{
            flex: 1, padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: period === p.key ? 'var(--color-primary)' : 'var(--color-surface-2)',
            color: period === p.key ? '#fff' : 'var(--color-text-muted)',
            transition: 'all 0.2s',
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p>
      ) : (
        <>
          <Card style={{ background: isPositive ? 'var(--color-primary)' : 'var(--color-expense)', color: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Wallet size={18} strokeWidth={1.5} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.9 }}>
                {isPositive ? 'Positivo no período' : 'Negativo no período'}
              </span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{fmt(balance)}</p>
          </Card>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Card style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--color-income)' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Entrou</span>
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-income)' }}>{fmt(data?.total_income ?? 0)}</p>
            </Card>
            <Card style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingDown size={16} style={{ color: 'var(--color-expense)' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Saiu</span>
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-expense)' }}>{fmt(data?.total_expense ?? 0)}</p>
            </Card>
          </div>

          <Card style={{ cursor: 'pointer' }} onClick={() => navigate('/investments')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Landmark size={18} style={{ color: 'var(--color-investment)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', flex: 1, fontWeight: 500 }}>Investimentos</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-investment)' }}>{fmt(investSummary?.total_balance ?? 0)}</span>
              <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </Card>

          <Card style={{ cursor: 'pointer' }} onClick={() => navigate('/analytics')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart3 size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', flex: 1, fontWeight: 500 }}>Ver análise detalhada</span>
              <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
