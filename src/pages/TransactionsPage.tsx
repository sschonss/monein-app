import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Plus, ArrowLeftRight, TrendingUp, TrendingDown, Landmark, Trash2, Pencil } from 'lucide-react';
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
  tags?: { id: number; name: string; color: string }[];
}

const typeIcons = { income: TrendingUp, expense: TrendingDown, investment: Landmark };
const typeColors = { income: 'var(--color-income)', expense: 'var(--color-expense)', investment: 'var(--color-investment)' };

function fmtCurrency(value: number, currency: string) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency });
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => { loadTransactions(); }, [filter]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.type = filter;
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.data || data);
    } catch { } finally { setLoading(false); }
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

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Transações</h1>
        <Button onClick={() => navigate('/transactions/new')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem' }}>
          <Plus size={16} /> Nova
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {['all', 'income', 'expense', 'investment'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.375rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 500, border: 'none', cursor: 'pointer',
            background: filter === f ? 'var(--color-primary)' : 'var(--color-surface-2)',
            color: filter === f ? '#fff' : 'var(--color-text-muted)',
          }}>
            {{ all: 'Todas', income: 'Entradas', expense: 'Saídas', investment: 'Investimentos' }[f]}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p> : transactions.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="Sem transações" description="Adicione sua primeira transação" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {transactions.map(t => {
            const Icon = typeIcons[t.type];
            const isForeign = t.currency && t.currency !== 'BRL';
            const sign = t.type === 'expense' ? '-' : '+';
            return (
              <Card key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate(`/transactions/${t.id}/edit`)}>
                <div style={{
                  width: 36, height: 36, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${t.category?.color || typeColors[t.type]}20`,
                }}>
                  <Icon size={18} style={{ color: t.category?.color || typeColors[t.type] }} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{t.category?.name || t.type} · {fmtDate(t.date)}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: typeColors[t.type], display: 'block' }}>
                    {sign}{isForeign ? fmtCurrency(Number(t.amount), t.currency) : fmtCurrency(Number(t.amount_brl), 'BRL')}
                  </span>
                  {isForeign && (
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block' }}>
                      {sign}{fmtCurrency(Number(t.amount_brl), 'BRL')}
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
      )}
    </div>
  );
}
