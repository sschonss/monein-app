import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Upload, FileText, Check, AlertCircle, Loader, Globe, DollarSign } from 'lucide-react';
import api from '../lib/api';

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  message: string;
  pending_global?: PendingGlobalTx[];
}

interface PendingGlobalTx {
  date: string;
  time: string;
  description: string;
  amount: number;
  currency?: 'USD' | 'EUR';
}

export default function ImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [pendingGlobal, setPendingGlobal] = useState<PendingGlobalTx[]>([]);
  const [globalCurrency, setGlobalCurrency] = useState<'USD' | 'EUR'>('USD');
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalResult, setGlobalResult] = useState<{ imported: number; skipped: number } | null>(null);

  function handleFile(f: File | undefined) {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setResult(null);
      setError('');
      setPendingGlobal([]);
      setGlobalResult(null);
    } else if (f) {
      setError('Selecione um arquivo PDF');
    }
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    setPendingGlobal([]);
    setGlobalResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/import/picpay', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setFile(null);

      if (data.pending_global?.length) {
        setPendingGlobal(data.pending_global.map((tx: PendingGlobalTx) => ({ ...tx, currency: 'USD' as const })));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  }

  function setTxCurrency(index: number, currency: 'USD' | 'EUR') {
    setPendingGlobal(prev => prev.map((tx, i) => i === index ? { ...tx, currency } : tx));
  }

  function setAllCurrency(currency: 'USD' | 'EUR') {
    setGlobalCurrency(currency);
    setPendingGlobal(prev => prev.map(tx => ({ ...tx, currency })));
  }

  async function handleConfirmGlobal() {
    setSavingGlobal(true);
    try {
      const { data } = await api.post('/import/confirm-global', {
        transactions: pendingGlobal.map(tx => ({
          date: tx.date,
          time: tx.time,
          description: tx.description,
          amount: tx.amount,
          currency: tx.currency || globalCurrency,
        })),
      });
      setGlobalResult(data);
      setPendingGlobal([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar transações da Conta Global');
    } finally {
      setSavingGlobal(false);
    }
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatAmount(amount: number) {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Importar Extrato</h1>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <FileText size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Extrato PicPay</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Importe seu extrato do PicPay para atualizar suas transações automaticamente. Transações duplicadas serão ignoradas.
            </p>
          </div>
        </div>
      </Card>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-surface-3)'}`,
          borderRadius: '0.75rem',
          padding: '2rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'var(--color-surface)' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <input ref={fileRef} type="file" accept=".pdf" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
        <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
        {file ? (
          <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{file.name}</p>
        ) : (
          <>
            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Toque para selecionar o PDF</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>ou arraste e solte aqui</p>
          </>
        )}
      </div>

      {file && (
        <Button onClick={handleUpload} fullWidth disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Importando...
            </span>
          ) : 'Importar Transações'}
        </Button>
      )}

      {error && (
        <Card style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>{error}</span>
          </div>
        </Card>
      )}

      {result && (
        <Card style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Check size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: '0.25rem' }}>Importação concluída</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                {result.imported} importadas · {result.skipped} ignoradas (duplicadas)
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                Total encontrado no extrato: {result.total}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Global Account Transactions - Currency Selection */}
      {pendingGlobal.length > 0 && (
        <>
          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Globe size={20} style={{ color: '#475569', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Conta Global · {pendingGlobal.length} transaç{pendingGlobal.length === 1 ? 'ão' : 'ões'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  Essas transferências para a Conta Global são investimentos. Selecione a moeda de destino:
                </p>

                {/* Default currency selector */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    onClick={() => setAllCurrency('USD')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${globalCurrency === 'USD' ? '#16a34a' : 'var(--color-surface-3)'}`,
                      background: globalCurrency === 'USD' ? 'rgba(22,163,74,0.1)' : 'var(--color-surface)',
                      color: globalCurrency === 'USD' ? '#16a34a' : 'var(--color-text-muted)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    🇺🇸 Dólar (USD)
                  </button>
                  <button
                    onClick={() => setAllCurrency('EUR')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${globalCurrency === 'EUR' ? '#2563eb' : 'var(--color-surface-3)'}`,
                      background: globalCurrency === 'EUR' ? 'rgba(37,99,235,0.1)' : 'var(--color-surface)',
                      color: globalCurrency === 'EUR' ? '#2563eb' : 'var(--color-text-muted)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    🇪🇺 Euro (EUR)
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Transaction list with individual currency toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingGlobal.map((tx, i) => (
              <Card key={i}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <DollarSign size={14} style={{ color: '#475569', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.description || 'Conta Global'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem', marginLeft: '1.375rem' }}>
                      {formatDate(tx.date)} · {formatAmount(tx.amount)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    <button
                      onClick={() => setTxCurrency(i, 'USD')}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        background: tx.currency === 'USD' ? '#16a34a' : 'var(--color-surface-2)',
                        color: tx.currency === 'USD' ? '#fff' : 'var(--color-text-muted)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      USD
                    </button>
                    <button
                      onClick={() => setTxCurrency(i, 'EUR')}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        background: tx.currency === 'EUR' ? '#2563eb' : 'var(--color-surface-2)',
                        color: tx.currency === 'EUR' ? '#fff' : 'var(--color-text-muted)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      EUR
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button onClick={handleConfirmGlobal} fullWidth disabled={savingGlobal}>
            {savingGlobal ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...
              </span>
            ) : `Salvar ${pendingGlobal.length} investimento${pendingGlobal.length === 1 ? '' : 's'}`}
          </Button>
        </>
      )}

      {/* Global account import result */}
      {globalResult && (
        <Card style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Globe size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: '0.25rem' }}>Conta Global importada</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                {globalResult.imported} investimento{globalResult.imported !== 1 ? 's' : ''} salvo{globalResult.imported !== 1 ? 's' : ''}
                {globalResult.skipped > 0 && ` · ${globalResult.skipped} ignorado${globalResult.skipped !== 1 ? 's' : ''} (duplicados)`}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
