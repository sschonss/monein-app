import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePrivacy } from '../contexts/PrivacyContext';
import Card from '../components/ui/Card';
import { ArrowLeft, Landmark, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

interface AccountDetail {
  id: number;
  name: string;
  current_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_yield: number;
  balance_evolution: { date: string; balance: number }[];
  monthly_yield: { month: string; yield: number }[];
  movements: { id: number; type: string; amount: number; balance_after: number; date: string }[];
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return fmt(v);
};

const typeLabels: Record<string, string> = { deposit: 'Depósito', withdrawal: 'Resgate', yield: 'Rendimento' };
const typeColors: Record<string, string> = { deposit: 'var(--color-investment)', withdrawal: 'var(--color-expense)', yield: 'var(--color-income)' };
const typeSigns: Record<string, string> = { deposit: '+', withdrawal: '-', yield: '+' };

export default function CofrinhoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mask } = usePrivacy();
  const [data, setData] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'deposit' | 'withdrawal' | 'yield'>('all');

  useEffect(() => {
    setLoading(true);
    api.get(`/investments/accounts/${id}`)
      .then(r => setData(r.data))
      .catch(() => navigate('/investments'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>Carregando...</div>;
  if (!data) return null;

  const filteredMovements = tab === 'all' ? data.movements : data.movements.filter(m => m.type === tab);

  const fmtDate = (d: string) => {
    const date = d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const yieldPct = data.total_deposited > 0 ? ((data.total_yield / data.total_deposited) * 100).toFixed(2) : '0';

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate('/investments')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.name}</h1>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Cofrinho PicPay</p>
        </div>
      </div>

      <Card style={{ background: 'var(--color-investment)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <PiggyBank size={18} strokeWidth={1.5} />
          <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Saldo Atual</span>
        </div>
        <p style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{mask(fmt(data.current_balance))}</p>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: data.total_withdrawn > 0 ? '1fr 1fr' : '1fr 1fr', gap: '0.5rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
            <TrendingUp size={14} style={{ color: 'var(--color-income)' }} />
            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Rendimentos</span>
          </div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-income)' }}>{mask(fmtCompact(data.total_yield))}</p>
          <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{yieldPct}% do depositado</p>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
            <Landmark size={14} style={{ color: 'var(--color-investment)' }} />
            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Depositado</span>
          </div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-investment)' }}>{mask(fmtCompact(data.total_deposited))}</p>
        </Card>
        {data.total_withdrawn > 0 && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
              <TrendingDown size={14} style={{ color: 'var(--color-expense)' }} />
              <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Resgatado</span>
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-expense)' }}>{mask(fmt(data.total_withdrawn))}</p>
          </Card>
        )}
      </div>

      {/* Balance evolution chart */}
      {data.balance_evolution.length > 1 && (
        <Card>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Evolução do Saldo</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.balance_evolution}>
              <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(d) => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompact(v)} domain={['dataMin', 'dataMax']} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }} formatter={(v) => fmt(Number(v))} labelFormatter={(d) => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('pt-BR'); }} />
              <Line type="monotone" dataKey="balance" stroke="var(--color-investment)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Monthly yield chart */}
      {data.monthly_yield.length > 1 && (
        <Card>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Rendimento Mensal</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.monthly_yield}>
              <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }} formatter={(v) => fmt(Number(v))} />
              <Bar dataKey="yield" name="Rendimento" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Movements */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem' }}>Movimentações</h2>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {(['all', 'yield', 'deposit', 'withdrawal'] as const).map(f => (
          <button key={f} onClick={() => setTab(f)} style={{
            padding: '0.375rem 0.75rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 500, border: 'none', cursor: 'pointer',
            background: tab === f ? 'var(--color-investment)' : 'var(--color-surface-2)',
            color: tab === f ? '#fff' : 'var(--color-text-muted)',
          }}>
            {{ all: 'Todas', yield: 'Rendimentos', deposit: 'Depósitos', withdrawal: 'Resgates' }[f]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {filteredMovements.map(m => (
          <Card key={m.id} style={{ padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${typeColors[m.type]}15`,
              }}>
                {m.type === 'yield' ? <TrendingUp size={16} style={{ color: typeColors[m.type] }} /> :
                 m.type === 'withdrawal' ? <TrendingDown size={16} style={{ color: typeColors[m.type] }} /> :
                 <Landmark size={16} style={{ color: typeColors[m.type] }} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{typeLabels[m.type]}</p>
                <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>{fmtDate(m.date)} · Saldo: {fmt(m.balance_after)}</p>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: typeColors[m.type] }}>
                {typeSigns[m.type]}{mask(fmt(m.amount))}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
