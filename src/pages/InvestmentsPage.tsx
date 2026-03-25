import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Landmark, TrendingUp, TrendingDown, Upload, ChevronRight, Trash2, Loader, Check, AlertCircle, PiggyBank } from 'lucide-react';
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

interface InvestmentSummary {
  total_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_yield: number;
  accounts_count: number;
}

interface DashboardData {
  total_income: number;
  total_investment: number;
  monthly_evolution: { month: string; income: number; expense: number; investment: number }[];
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return fmt(v);
};

export default function InvestmentsPage() {
  const navigate = useNavigate();
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

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Investimentos</h1>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p>
      ) : (
        <>
          {/* Summary cards */}
          {summary && summary.total_balance > 0 && (
            <>
              <Card style={{ background: 'var(--color-investment)', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Landmark size={18} strokeWidth={1.5} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase' }}>Saldo Cofrinhos</span>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{fmt(summary.total_balance)}</p>
              </Card>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Card style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <TrendingUp size={14} style={{ color: 'var(--color-income)' }} />
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Rendimentos</span>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-income)' }}>{fmt(summary.total_yield)}</p>
                </Card>
                <Card style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Landmark size={14} style={{ color: 'var(--color-investment)' }} />
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Depositado</span>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-investment)' }}>{fmt(summary.total_deposited)}</p>
                </Card>
              </div>
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
                        Rend. {fmt(acc.total_yield)} · Atualizado {fmtDate(acc.last_update)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-investment)' }}>{fmtCompact(acc.current_balance)}</p>
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
