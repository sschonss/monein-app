import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import { TrendingUp, TrendingDown, Landmark, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../lib/api';

interface DashboardData {
  balance: number;
  total_income: number;
  total_expense: number;
  total_investment: number;
  by_category: { name: string; total: number; color: string }[];
  by_category_income: { name: string; total: number; color: string }[];
  monthly_evolution: { month: string; income: number; expense: number; investment: number }[];
}

const periods = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
  { key: 'all', label: 'Tudo' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard', { params: { period } })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const parseCatData = (items: { name: string; total: number | string; color: string }[]) =>
    items.map(c => ({ ...c, total: Number(c.total) }));
  const fmtCompact = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 10_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
    return fmt(v);
  };

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
          <Card style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Wallet size={18} strokeWidth={1.5} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.9 }}>Saldo</span>
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{fmt(data?.balance ?? 0)}</p>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <Card style={{ overflow: 'hidden' }}>
              <TrendingUp size={16} style={{ color: 'var(--color-income)', marginBottom: '0.375rem' }} />
              <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Entradas</p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-income)', marginTop: '0.125rem', whiteSpace: 'nowrap' }}>{fmtCompact(data?.total_income ?? 0)}</p>
            </Card>
            <Card style={{ overflow: 'hidden' }}>
              <TrendingDown size={16} style={{ color: 'var(--color-expense)', marginBottom: '0.375rem' }} />
              <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Saídas</p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-expense)', marginTop: '0.125rem', whiteSpace: 'nowrap' }}>{fmtCompact(data?.total_expense ?? 0)}</p>
            </Card>
            <Card style={{ overflow: 'hidden' }}>
              <Landmark size={16} style={{ color: 'var(--color-investment)', marginBottom: '0.375rem' }} />
              <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Investido</p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-investment)', marginTop: '0.125rem', whiteSpace: 'nowrap' }}>{fmtCompact(data?.total_investment ?? 0)}</p>
            </Card>
          </div>

          {data?.by_category && data.by_category.length > 0 && (() => {
            const catData = parseCatData(data.by_category);
            return (
            <Card>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Saídas por Categoria</h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={catData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                    {catData.map((entry, i) => <Cell key={i} fill={entry.color || '#6b7280'} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {catData.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color || '#6b7280' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{c.name} ({fmtCompact(c.total)})</span>
                  </div>
                ))}
              </div>
            </Card>
            );
          })()}

          {data?.by_category_income && data.by_category_income.length > 0 && (() => {
            const catData = parseCatData(data.by_category_income);
            return (
            <Card>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Entradas por Categoria</h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={catData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                    {catData.map((entry, i) => <Cell key={i} fill={entry.color || '#22c55e'} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {catData.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color || '#22c55e' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{c.name} ({fmtCompact(c.total)})</span>
                  </div>
                ))}
              </div>
            </Card>
            );
          })()}

          {data?.monthly_evolution && data.monthly_evolution.length > 0 && (
            <Card>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Evolução Mensal</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.monthly_evolution}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }} formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
