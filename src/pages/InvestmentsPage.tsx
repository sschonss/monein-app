import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Landmark, TrendingUp, TrendingDown, Pencil, Trash2, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../lib/api';

interface Transaction {
  id: number;
  type: 'income' | 'expense' | 'investment';
  description: string;
  amount: number;
  amount_brl: number;
  currency: string;
  exchange_rate: number | null;
  date: string;
  category?: { name: string; icon: string; color: string };
}

interface DashboardData {
  total_income: number;
  total_investment: number;
  by_category_investment: { name: string; total: string | number; color: string }[];
  monthly_evolution: { month: string; income: number; expense: number; investment: number }[];
}

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return fmt(v);
};

const periods = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
  { key: 'all', label: 'Tudo' },
];

export default function InvestmentsPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [period, setPeriod] = useState('month');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard', { params: { period } })
      .then(r => setDash(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

  const loadTransactions = useCallback(async (p: number, append = false) => {
    if (p === 1) setLoadingTx(true); else setLoadingMore(true);
    try {
      const params: Record<string, string> = { page: String(p), type: 'investment', date_from: dateFrom, date_to: dateTo };
      const { data } = await api.get('/transactions', { params });
      const items = data.data || data;
      const lastPage = data.last_page || 1;
      setHasMore(p < lastPage);
      setTransactions(prev => append ? [...prev, ...items] : items);
    } catch { } finally { setLoadingTx(false); setLoadingMore(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { setPage(1); loadTransactions(1); }, [loadTransactions]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    loadTransactions(next, true);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir transação?')) return;
    await api.delete(`/transactions/${id}`);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  const fmtDate = (d: string) => {
    const date = d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const investCat = (dash?.by_category_investment || []).map(c => ({ ...c, total: Number(c.total) }));
  const monthlyInvestment = (dash?.monthly_evolution || []).map(m => ({ month: m.month, investment: m.investment }));
  const totalInvested = dash?.total_investment ?? 0;
  const totalIncome = dash?.total_income ?? 0;
  const investPct = totalIncome > 0 ? ((totalInvested / totalIncome) * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Investimentos</h1>
        <Button onClick={() => navigate('/transactions/new')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem' }}>
          <Plus size={16} /> Novo
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)} style={{
            flex: 1, padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: period === p.key ? 'var(--color-investment)' : 'var(--color-surface-2)',
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Card style={{ flex: 1, background: 'var(--color-investment)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Landmark size={16} strokeWidth={1.5} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Investido</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{fmt(totalInvested)}</p>
            </Card>
            <Card style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--color-income)' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>% da Renda</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-investment)' }}>{investPct}%</p>
            </Card>
          </div>

          {investCat.length > 0 && (
            <Card>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Por Categoria</h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={investCat} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                    {investCat.map((entry, i) => <Cell key={i} fill={entry.color || '#2563eb'} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                {investCat.map((c, i) => {
                  const total = investCat.reduce((s, x) => s + x.total, 0);
                  const pct = total > 0 ? ((c.total / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color || '#2563eb', flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--color-text)' }}>{c.name}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{pct}%</span>
                      <span style={{ fontWeight: 600, minWidth: '70px', textAlign: 'right' }}>{fmtCompact(c.total)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {monthlyInvestment.some(m => m.investment > 0) && (
            <Card>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Evolução Mensal</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyInvestment}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }} formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="investment" name="Investido" fill="var(--color-investment)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Transações</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
            {MONTHS_PT[month]} {year}
          </span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loadingTx ? <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p> : transactions.length === 0 ? (
        <EmptyState icon={Landmark} title="Sem investimentos" description={`Nenhum investimento em ${MONTHS_PT[month]}`} />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {transactions.map(t => {
              const isForeign = t.currency && t.currency !== 'BRL';
              return (
                <Card key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate(`/transactions/${t.id}/edit`)}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${t.category?.color || 'var(--color-investment)'}20`,
                  }}>
                    <Landmark size={18} style={{ color: t.category?.color || 'var(--color-investment)' }} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{t.category?.name || 'Investimento'} · {fmtDate(t.date)}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-investment)', display: 'block' }}>
                      +{isForeign ? fmt(Number(t.amount)) : fmt(Number(t.amount_brl))}
                    </span>
                    {isForeign && (
                      <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block' }}>
                        +{fmt(Number(t.amount_brl))}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/transactions/${t.id}/edit`); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          {hasMore && (
            <button onClick={handleLoadMore} disabled={loadingMore} style={{
              background: 'var(--color-surface-2)', border: 'none', borderRadius: '0.5rem',
              padding: '0.625rem', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
              color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              {loadingMore ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...</> : 'Carregar mais'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
