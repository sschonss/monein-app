import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CurrencyInput from '../components/ui/CurrencyInput';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';

interface Category { id: number; name: string; type: string; color: string; }
interface Tag { id: number; name: string; color: string; }

export default function TransactionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [type, setType] = useState<string>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || r.data));
    api.get('/tags').then(r => setTags(r.data.data || r.data));
    if (isEdit) {
      api.get(`/transactions/${id}`).then(r => {
        const t = r.data.data || r.data;
        setType(t.type); setDescription(t.description); setAmount(String(t.amount));
        setCurrency(t.currency); setDate(t.date); setCategoryId(String(t.category_id || ''));
        setSelectedTags(t.tags?.map((tag: Tag) => tag.id) || []); setNotes(t.notes || '');
      });
    }
  }, [id]);

  const filteredCategories = categories.filter(c => c.type === type);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = { type, description, amount: parseFloat(amount), currency, date, category_id: categoryId || null, tag_ids: selectedTags, notes: notes || null };
      if (isEdit) await api.put(`/transactions/${id}`, payload);
      else await api.post('/transactions', payload);
      navigate('/transactions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  function toggleTag(tagId: number) {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{isEdit ? 'Editar' : 'Nova'} Transação</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['expense', 'income', 'investment'].map(t => (
            <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }} style={{
              flex: 1, padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 500, border: 'none', cursor: 'pointer',
              background: type === t ? (t === 'income' ? 'var(--color-income)' : t === 'expense' ? 'var(--color-expense)' : 'var(--color-investment)') : 'var(--color-surface-2)',
              color: type === t ? '#fff' : 'var(--color-text-muted)',
            }}>
              {{ expense: 'Saída', income: 'Entrada', investment: 'Investimento' }[t]}
            </button>
          ))}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Descrição</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Almoço, Netflix, Salário..." required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Valor</label>
            <CurrencyInput value={amount} onChange={setAmount} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Moeda</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="BRL">BRL</option><option value="USD">USD</option><option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Categoria</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {tags.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {tags.map(tag => (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} style={{
                  padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer',
                  background: selectedTags.includes(tag.id) ? tag.color : 'var(--color-surface-2)',
                  color: selectedTags.includes(tag.id) ? '#fff' : 'var(--color-text-muted)',
                  border: 'none',
                }}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Notas (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observações..." />
        </div>

        <Button type="submit" fullWidth disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
      </form>
    </div>
  );
}
