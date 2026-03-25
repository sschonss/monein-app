import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../lib/api';

interface DashboardData {
  balance: number;
  total_income: number;
  total_expense: number;
  total_investment: number;
  by_category: { name: string; total: string | number; color: string }[];
  by_category_income: { name: string; total: string | number; color: string }[];
  monthly_evolution: { month: string; income: number; expense: number; investment: number }[];
}

const periods = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
  { key: 'all', label: 'Tudo' },
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return fmt(v);
};
const parseCat = (items: { name: string; total: string | number; color: string }[]) =>
  items.map(c => ({ ...c, total: Number(c.total) }));

function CategoryPie({ title, data, fallbackColor, icon }: {
  title: string;
  data: { name: string; total: number; color: string }[];
  fallbackColor: string;
  icon: React.ReactNode;
}) {
  if (!data.length) return null;
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {icon}
        <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>{title}</h2>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} strokeWidth={0}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color || fallbackColor} />)}
          </Pie>
          <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
        {data.map((c, i) => {
          const total = data.reduce((s, x) => s + x.total, 0);
          const pct = total > 0 ? ((c.total / total) * 100).toFixed(1) : '0';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color || fallbackColor, flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'var(--color-text)' }}>{c.name}</span>
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{pct}%</span>
              <span style={{ fontWeight: 600, minWidth: '70px', textAlign: 'right' }}>{fmtCompact(c.total)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
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

  const expenseCat = data?.by_category ? parseCat(data.by_category) : [];
  const incomeCat = data?.by_category_income ? parseCat(data.by_category_income) : [];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Análise Detalhada</h1>
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
          <CategoryPie
            title="Saídas por Categoria"
            data={expenseCat}
            fallbackColor="#6b7280"
            icon={<TrendingDown size={16} style={{ color: 'var(--color-expense)' }} />}
          />

          <CategoryPie
            title="Entradas por Categoria"
            data={incomeCat}
            fallbackColor="#22c55e"
            icon={<TrendingUp size={16} style={{ color: 'var(--color-income)' }} />}
          />

          {data?.monthly_evolution && data.monthly_evolution.length > 0 && (
            <Card>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Evolução Mensal</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthly_evolution}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }} formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="income" name="Entradas" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Saídas" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
