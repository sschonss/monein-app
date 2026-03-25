import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePrivacy } from '../contexts/PrivacyContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Globe, TrendingUp, TrendingDown, Plus, X, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../lib/api';

interface GlobalTx {
  id: number;
  date: string;
  description: string;
  amount: number;
  amount_brl: number;
  currency: string;
  direction: 'deposit' | 'return' | 'spend';
}

interface CurrencyTotal {
  currency: string;
  total_brl: number;
  count: number;
}

interface MonthlyData {
  month: string;
  deposits: number;
  returns: number;
}

interface ManualBalance {
  currency: string;
  balance: number;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtForeign = (v: number, cur: string) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + cur;
const currencyFlags: Record<string, string> = { USD: '🇺🇸', EUR: '🇪🇺', BRL: '🇧🇷' };
const currencyNames: Record<string, string> = { USD: 'Dólar', EUR: 'Euro', BRL: 'Real' };

export default function GlobalAccountPage() {
  const navigate = useNavigate();
  const { mask } = usePrivacy();
  const [searchParams] = useSearchParams();
  const initialCurrency = searchParams.get('currency') || 'all';

  const [transactions, setTransactions] = useState<GlobalTx[]>([]);
  const [totals, setTotals] = useState<CurrencyTotal[]>([]);
  const [totalReturns, setTotalReturns] = useState(0);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialCurrency);
  const [tab, setTab] = useState<'all' | 'deposit' | 'return' | 'spend'>('all');
  const [showSpendForm, setShowSpendForm] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendDate, setSpendDate] = useState(new Date().toISOString().split('T')[0]);
  const [spendDesc, setSpendDesc] = useState('');
  const [spendCurrency, setSpendCurrency] = useState<'USD' | 'EUR'>('USD');
  const [saving, setSaving] = useState(false);
  const [manualBalances, setManualBalances] = useState<ManualBalance[]>([]);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustUSD, setAdjustUSD] = useState('');
  const [adjustEUR, setAdjustEUR] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);

  function loadData() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filter !== 'all') params.currency = filter;

    api.get('/investments/global-account', { params })
      .then(r => {
        setTransactions(r.data.transactions);
        setTotals(r.data.totals);
        setTotalReturns(r.data.total_returns);
        setMonthly(r.data.monthly);
        if (r.data.manual_balances) setManualBalances(r.data.manual_balances);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, [filter]);

  async function handleSpend() {
    if (!spendAmount || parseFloat(spendAmount) <= 0) return;
    setSaving(true);
    try {
      await api.post('/investments/global-account/spend', {
        amount: parseFloat(spendAmount),
        date: spendDate,
        description: spendDesc || undefined,
        currency: spendCurrency,
      });
      setShowSpendForm(false);
      setSpendAmount('');
      setSpendDesc('');
      loadData();
    } catch {}
    setSaving(false);
  }

  async function handleAdjust() {
    const balances: { currency: string; balance: number }[] = [];
    if (adjustUSD !== '') balances.push({ currency: 'USD', balance: parseFloat(adjustUSD) || 0 });
    if (adjustEUR !== '') balances.push({ currency: 'EUR', balance: parseFloat(adjustEUR) || 0 });
    if (balances.length === 0) return;
    setAdjustSaving(true);
    try {
      await api.post('/investments/global-account/adjust', { balances });
      setShowAdjustForm(false);
      loadData();
    } catch {}
    setAdjustSaving(false);
  }

  const totalDeposited = totals.reduce((sum, t) => sum + t.total_brl, 0);
  const netAmount = totalDeposited - totalReturns;

  const manualUSD = manualBalances.find(b => b.currency === 'USD');
  const manualEUR = manualBalances.find(b => b.currency === 'EUR');
  const hasManualBalance = manualBalances.length > 0;

  const filteredTx = tab === 'all' ? transactions : transactions.filter(t =>
    tab === 'return' ? (t.direction === 'return' || t.direction === 'spend') : t.direction === tab
  );

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const currencies = totals.map(t => t.currency);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate('/investments')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Conta Global</h1>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Investimentos em moeda estrangeira</p>
        </div>
        <button
          onClick={() => {
            setShowAdjustForm(!showAdjustForm);
            if (!showAdjustForm) {
              setAdjustUSD(manualUSD ? String(manualUSD.balance) : '');
              setAdjustEUR(manualEUR ? String(manualEUR.balance) : '');
            }
          }}
          style={{
            background: showAdjustForm ? '#475569' : 'var(--color-surface-2)',
            border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem',
            color: showAdjustForm ? '#fff' : 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center',
          }}
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Adjust account form */}
      {showAdjustForm && (
        <Card style={{ border: '1px solid #475569', background: 'rgba(71,85,105,0.05)' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.75rem' }}>⚙️ Ajustar Conta</h3>
          <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Informe o saldo real da sua conta em cada moeda
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>🇺🇸 Saldo em Dólar (USD)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={adjustUSD}
                onChange={e => setAdjustUSD(e.target.value)}
                style={{
                  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                  border: '1px solid var(--color-surface-3)', background: 'var(--color-surface)',
                  color: 'var(--color-text)', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>🇪🇺 Saldo em Euro (EUR)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={adjustEUR}
                onChange={e => setAdjustEUR(e.target.value)}
                style={{
                  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                  border: '1px solid var(--color-surface-3)', background: 'var(--color-surface)',
                  color: 'var(--color-text)', boxSizing: 'border-box',
                }}
              />
            </div>
            <Button onClick={handleAdjust} fullWidth disabled={adjustSaving || (adjustUSD === '' && adjustEUR === '')}>
              {adjustSaving ? 'Salvando...' : 'Salvar Saldo'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p>
      ) : (
        <>
          {/* Balance cards */}
          {hasManualBalance ? (
            <div style={{ display: 'grid', gridTemplateColumns: manualUSD && manualEUR ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
              {manualUSD && (
                <Card style={{ background: '#475569', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1rem' }}>🇺🇸</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Saldo USD</span>
                  </div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{mask(fmtForeign(manualUSD.balance, 'USD'))}</p>
                </Card>
              )}
              {manualEUR && (
                <Card style={{ background: '#475569', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1rem' }}>🇪🇺</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Saldo EUR</span>
                  </div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{mask(fmtForeign(manualEUR.balance, 'EUR'))}</p>
                </Card>
              )}
            </div>
          ) : (
            <Card style={{ background: '#475569', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Globe size={18} strokeWidth={1.5} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Saldo Estimado</span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{mask(fmt(netAmount))}</p>
              <p style={{ fontSize: '0.625rem', opacity: 0.7, marginTop: '0.25rem' }}>Ajuste o saldo real em ⚙️ Ajustar Conta</p>
            </Card>
          )}

          {/* Deposited vs Returned — only when no manual balance */}
          {!hasManualBalance && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                  <TrendingUp size={14} style={{ color: '#475569' }} />
                  <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Enviado</span>
                </div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#475569' }}>{mask(fmt(totalDeposited))}</p>
              </Card>
              {totalReturns > 0 && (
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                    <TrendingDown size={14} style={{ color: 'var(--color-income)' }} />
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Resgatado</span>
                  </div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-income)' }}>{mask(fmt(totalReturns))}</p>
                </Card>
              )}
            </div>
          )}

          {/* Currency breakdown — only when no manual balance and multiple currencies */}
          {!hasManualBalance && totals.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {totals.map(t => (
                <Card key={t.currency}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '1rem' }}>{currencyFlags[t.currency]}</span>
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {currencyNames[t.currency] || t.currency}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{mask(fmt(t.total_brl))}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Currency filter */}
          {currencies.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setFilter('all')} style={{
                padding: '0.375rem 0.75rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 500, border: 'none', cursor: 'pointer',
                background: filter === 'all' ? '#475569' : 'var(--color-surface-2)',
                color: filter === 'all' ? '#fff' : 'var(--color-text-muted)',
              }}>
                Todas
              </button>
              {currencies.map(c => (
                <button key={c} onClick={() => setFilter(c)} style={{
                  padding: '0.375rem 0.75rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 500, border: 'none', cursor: 'pointer',
                  background: filter === c ? '#475569' : 'var(--color-surface-2)',
                  color: filter === c ? '#fff' : 'var(--color-text-muted)',
                }}>
                  {currencyFlags[c]} {c}
                </button>
              ))}
            </div>
          )}

          {/* Monthly evolution chart */}
          {monthly.length > 1 && (
            <Card>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Evolução Mensal</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthly}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.75rem' }}
                    formatter={(v) => fmt(Number(v))}
                  />
                  <Bar dataKey="deposits" name="Enviado" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returns" name="Resgatado" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  {monthly.some(m => m.returns > 0) && <Legend wrapperStyle={{ fontSize: '0.625rem' }} />}
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Transactions header + add spend button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Transações</h2>
            <button
              onClick={() => setShowSpendForm(!showSpendForm)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: showSpendForm ? 'var(--color-surface-2)' : 'var(--color-expense)',
                color: showSpendForm ? 'var(--color-text-muted)' : '#fff',
              }}
            >
              {showSpendForm ? <X size={14} /> : <Plus size={14} />}
              {showSpendForm ? 'Cancelar' : 'Registrar Gasto'}
            </button>
          </div>

          {/* Spend form */}
          {showSpendForm && (
            <Card style={{ border: '1px solid var(--color-expense)', background: 'rgba(239,68,68,0.03)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={spendAmount}
                    onChange={e => setSpendAmount(e.target.value)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                      border: '1px solid var(--color-surface-3)', background: 'var(--color-surface)',
                      color: 'var(--color-text)', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Data</label>
                  <input
                    type="date"
                    value={spendDate}
                    onChange={e => setSpendDate(e.target.value)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                      border: '1px solid var(--color-surface-3)', background: 'var(--color-surface)',
                      color: 'var(--color-text)', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Moeda</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['USD', 'EUR'] as const).map(c => (
                      <button key={c} onClick={() => setSpendCurrency(c)} style={{
                        flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                        border: 'none', cursor: 'pointer',
                        background: spendCurrency === c ? '#475569' : 'var(--color-surface-2)',
                        color: spendCurrency === c ? '#fff' : 'var(--color-text-muted)',
                      }}>
                        {currencyFlags[c]} {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Descrição (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Compra na Amazon"
                    value={spendDesc}
                    onChange={e => setSpendDesc(e.target.value)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                      border: '1px solid var(--color-surface-3)', background: 'var(--color-surface)',
                      color: 'var(--color-text)', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <Button onClick={handleSpend} fullWidth disabled={saving || !spendAmount}>
                  {saving ? 'Salvando...' : 'Salvar Gasto'}
                </Button>
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['all', 'deposit', 'return'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '0.375rem 0.75rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 500, border: 'none', cursor: 'pointer',
                background: tab === t ? '#475569' : 'var(--color-surface-2)',
                color: tab === t ? '#fff' : 'var(--color-text-muted)',
              }}>
                {{ all: 'Todas', deposit: 'Enviadas', return: 'Resgates' }[t]}
              </button>
            ))}
          </div>

          {filteredTx.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
              Nenhuma transação encontrada
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {filteredTx.map(tx => (
                <Card key={`${tx.id}-${tx.direction}`} style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: tx.direction === 'return' ? 'rgba(34,197,94,0.1)' : tx.direction === 'spend' ? 'rgba(239,68,68,0.1)' : 'rgba(71,85,105,0.1)',
                    }}>
                      {tx.direction === 'return' ? (
                        <TrendingDown size={16} style={{ color: 'var(--color-income)' }} />
                      ) : tx.direction === 'spend' ? (
                        <TrendingDown size={16} style={{ color: 'var(--color-expense)' }} />
                      ) : (
                        <span style={{ fontSize: '0.875rem' }}>{currencyFlags[tx.currency] || '💱'}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.direction === 'return' ? 'Resgate AstroPay' : tx.direction === 'spend' ? (tx.description || 'Gasto Conta Global') : (tx.description || 'Conta Global')}
                      </p>
                      <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                        {fmtDate(tx.date)} · {tx.direction === 'return' ? 'Resgate' : tx.direction === 'spend' ? 'Gasto' : tx.currency}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: tx.direction === 'return' ? 'var(--color-income)' : tx.direction === 'spend' ? 'var(--color-expense)' : '#475569' }}>
                        {tx.direction === 'deposit' ? '-' : tx.direction === 'return' ? '+' : '-'}{mask(fmt(tx.amount_brl))}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
