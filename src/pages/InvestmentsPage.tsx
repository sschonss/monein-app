import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivacy } from '../contexts/PrivacyContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Landmark, TrendingUp, TrendingDown, Upload, ChevronRight, Trash2, Loader, Check, AlertCircle, PiggyBank, Globe, DollarSign, Euro, Coins } from 'lucide-react';
import api from '../lib/api';

interface InvestmentAccount {
  id: number;
  name: string;
  current_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_yield: number;
  movements_count: number;
  last_update: string | null;
}

interface GlobalCurrency {
  currency: string;
  total_brl: number;
  count: number;
}

interface GlobalAccount {
  total_deposited_brl: number;
  total_returned_brl: number;
  net_brl: number;
  returns_count: number;
  by_currency: GlobalCurrency[];
  manual_balances?: Record<string, number>;
}

interface InvestmentSummary {
  total_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_yield: number;
  accounts_count: number;
  global_account: GlobalAccount;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return fmt(v);
};

const currencyIcons: Record<string, typeof DollarSign> = { USD: DollarSign, EUR: Euro, BRL: Coins };
const currencyNames: Record<string, string> = { USD: 'Dólar', EUR: 'Euro', BRL: 'Real' };

function CurrencyIcon({ currency, size = 14 }: { currency: string; size?: number }) {
  const Icon = currencyIcons[currency] || Globe;
  return <Icon size={size} />;
}

export default function InvestmentsPage() {
  const navigate = useNavigate();
  const { mask } = usePrivacy();
  const fileRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ message: string; imported: number; skipped: number; account_name: string } | null>(null);
  const [uploadError, setUploadError] = useState('');

  function loadAll() {
    setLoading(true);
    Promise.all([
      api.get('/investments/summary'),
      api.get('/investments/accounts'),
    ]).then(([summaryRes, accountsRes]) => {
      setSummary(summaryRes.data);
      setAccounts(accountsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function handleUpload(file: File) {
    if (file.type !== 'application/pdf') {
      setUploadError('Selecione um arquivo PDF');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/investments/import/cofrinho', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(data);
      loadAll();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Erro ao importar');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDeleteAccount(id: number, name: string) {
    if (!confirm(`Remover cofrinho "${name}" e todas as movimentações?`)) return;
    await api.delete(`/investments/accounts/${id}`);
    loadAll();
  }

  const fmtDate = (d: string | null) => {
    if (!d) return '-';
    const date = d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const totalInvested = summary ? summary.total_balance : 0;
  const globalTotal = summary?.global_account?.net_brl || 0;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Investimentos</h1>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p>
      ) : (
        <>
          {/* Cofrinhos balance card */}
          {totalInvested > 0 && (
            <Card style={{ background: 'var(--color-investment)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <PiggyBank size={18} strokeWidth={1.5} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Saldo Cofrinhos</span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{mask(fmt(totalInvested))}</p>
            </Card>
          )}

          {/* Summary cards */}
          {summary && (totalInvested > 0 || globalTotal > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {summary.total_yield > 0 && (
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp size={14} style={{ color: 'var(--color-income)' }} />
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Rendimentos</span>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-income)' }}>{mask(fmtCompact(summary.total_yield))}</p>
                </Card>
              )}
              {summary.total_deposited > 0 && (
                <Card>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Landmark size={14} style={{ color: 'var(--color-investment)' }} />
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Depositado</span>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-investment)' }}>{mask(fmtCompact(summary.total_deposited))}</p>
                </Card>
              )}
            </div>
          )}

          {/* Conta Global section */}
          {summary?.global_account?.by_currency && summary.global_account.by_currency.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Globe size={18} style={{ color: '#475569' }} />
                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Conta Global</h2>
              </div>

              {/* Balance card - shows manual balances if set, otherwise estimated */}
              {summary.global_account.manual_balances && Object.keys(summary.global_account.manual_balances).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: Object.keys(summary.global_account.manual_balances).length > 1 ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
                  {Object.entries(summary.global_account.manual_balances).map(([cur, bal]) => (
                    <Card key={cur} style={{ background: '#475569', color: '#fff', cursor: 'pointer' }} onClick={() => navigate(`/investments/global?currency=${cur}`)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <CurrencyIcon currency={cur} size={16} />
                        <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Saldo {cur}</span>
                      </div>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                        {mask(`${(bal as number).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`)}
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  <Card style={{ background: '#475569', color: '#fff', cursor: 'pointer' }} onClick={() => navigate('/investments/global')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Globe size={16} strokeWidth={1.5} />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Saldo Estimado</span>
                    </div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{mask(fmt(summary.global_account.net_brl))}</p>
                    <p style={{ fontSize: '0.625rem', opacity: 0.75, marginTop: '0.25rem' }}>
                      Enviado {mask(fmt(summary.global_account.total_deposited_brl))}
                      {summary.global_account.total_returned_brl > 0 && ` · Resgatado ${mask(fmt(summary.global_account.total_returned_brl))}`}
                    </p>
                  </Card>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {summary.global_account.by_currency.map(gc => (
                      <Card key={gc.currency} style={{ cursor: 'pointer' }} onClick={() => navigate(`/investments/global?currency=${gc.currency}`)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <CurrencyIcon currency={gc.currency} size={16} />
                          <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                            {currencyNames[gc.currency] || gc.currency}
                          </span>
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>{mask(fmt(gc.total_brl))}</p>
                        <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                          {gc.count} transferência{gc.count !== 1 ? 's' : ''}
                        </p>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Cofrinhos section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Cofrinhos</h2>
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem' }}>
              {uploading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={16} />}
              {uploading ? 'Importando...' : 'Importar PDF'}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} style={{ display: 'none' }} />
          </div>

          {uploadError && (
            <Card style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger)' }}>{uploadError}</span>
              </div>
            </Card>
          )}

          {uploadResult && (
            <Card style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-success)' }}>{uploadResult.account_name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{uploadResult.imported} importadas · {uploadResult.skipped} ignoradas</p>
                </div>
              </div>
            </Card>
          )}

          {accounts.length === 0 ? (
            <EmptyState icon={PiggyBank} title="Sem cofrinhos" description="Importe um PDF de cofrinho do PicPay" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {accounts.map(acc => (
                <Card key={acc.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/investments/${acc.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(37,99,235,0.1)',
                    }}>
                      <PiggyBank size={20} style={{ color: 'var(--color-investment)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        Rend. {mask(fmt(acc.total_yield))} · Atualizado {fmtDate(acc.last_update)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-investment)' }}>{mask(fmtCompact(acc.current_balance))}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.id, acc.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
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
