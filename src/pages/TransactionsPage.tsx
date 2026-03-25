import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Plus, ArrowLeftRight, TrendingUp, TrendingDown, Landmark, Trash2, Pencil, ChevronLeft, ChevronRight, Loader, Search, X } from 'lucide-react';
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
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function fmtCurrency(value: number, currency: string) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency });
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState('');

  const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadTransactions = useCallback(async (p: number, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params: Record<string, string> = { page: String(p) };
      if (!searchActive) {
        params.date_from = dateFrom;
        params.date_to = dateTo;
      }
      if (filter !== 'all') params.type = filter;
      if (searchDebounce) params.search = searchDebounce;
      const { data } = await api.get('/transactions', { params });
      const items = data.data || data;
      const lastPage = data.last_page || 1;
      setHasMore(p < lastPage);
      setTransactions(prev => append ? [...prev, ...items] : items);
    } catch { } finally { setLoading(false); setLoadingMore(false); }
  }, [filter, dateFrom, dateTo, searchDebounce, searchActive]);

  useEffect(() => { setPage(1); loadTransactions(1); }, [loadTransactions]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    loadTransactions(next, true);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { setSearchActive(!searchActive); if (searchActive) setSearch(''); }} style={{
            background: searchActive ? 'var(--color-primary)' : 'var(--color-surface-2)', border: 'none', borderRadius: '0.5rem',
            padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
            color: searchActive ? '#fff' : 'var(--color-text-muted)',
          }}>
            <Search size={16} />
          </button>
          <Button onClick={() => navigate('/transactions/new')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem' }}>
            <Plus size={16} /> Nova
          </Button>
        </div>
      </div>

      {searchActive && (
        <div style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou valor..."
            autoFocus
            style={{ paddingRight: '2.5rem' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem',
            }}>
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {!searchActive && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, minWidth: '140px', textAlign: 'center' }}>
          {MONTHS_PT[month]} {year}
        </span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
          <ChevronRight size={20} />
        </button>
      </div>
      )}

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
        <EmptyState icon={ArrowLeftRight} title="Sem transações" description={`Nenhuma transação em ${MONTHS_PT[month]}`} />
      ) : (
        <>
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
