import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import CurrencyInput from '../components/ui/CurrencyInput';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';

interface Category { id: number; name: string; type: string; }

export default function RecurringFormPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.data || r.data)); }, []);

  const filteredCategories = categories.filter(c => c.type === type);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/recurring-transactions', { type, description, amount: parseFloat(amount), currency, frequency, next_due_date: nextDueDate, category_id: categoryId || null });
      navigate('/recurring');
    } catch (err: any) { setError(err.response?.data?.message || 'Erro ao salvar'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Nova Recorrente</h1>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['expense', 'income', 'investment'].map(t => (
            <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }} style={{
              flex: 1, padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 500, border: 'none', cursor: 'pointer',
              background: type === t ? (t === 'income' ? 'var(--color-income)' : t === 'expense' ? 'var(--color-expense)' : 'var(--color-investment)') : 'var(--color-surface-2)',
              color: type === t ? '#fff' : 'var(--color-text-muted)',
            }}>{{ expense: 'Saída', income: 'Entrada', investment: 'Investimento' }[t]}</button>
          ))}
        </div>
        <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Descrição</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Aluguel, Spotify..." required /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Valor</label><CurrencyInput value={amount} onChange={setAmount} required /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Moeda</label><select value={currency} onChange={e => setCurrency(e.target.value)}><option value="BRL">BRL</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Frequência</label><select value={frequency} onChange={e => setFrequency(e.target.value)}><option value="weekly">Semanal</option><option value="biweekly">Quinzenal</option><option value="monthly">Mensal</option><option value="yearly">Anual</option></select></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Próxima data</label><input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} required /></div>
        </div>
        <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>Categoria</label><select value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Sem categoria</option>{filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <Button type="submit" fullWidth disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
      </form>
    </div>
  );
}
