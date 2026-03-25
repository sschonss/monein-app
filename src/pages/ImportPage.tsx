import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Upload, FileText, Check, AlertCircle, Loader } from 'lucide-react';
import api from '../lib/api';

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  message: string;
}

export default function ImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File | undefined) {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setResult(null);
      setError('');
    } else if (f) {
      setError('Selecione um arquivo PDF');
    }
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/import/picpay', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao importar');
    } finally {
      setLoading(false);
    }
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
    </div>
  );
}
