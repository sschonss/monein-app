import { useState, useEffect, FormEvent } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Trash2, Tags, X } from 'lucide-react';
import api from '../lib/api';

interface Category { id: number; name: string; type: string; icon: string; color: string; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('tag');
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    api.get('/categories').then(r => setCategories(r.data.data || r.data)).finally(() => setLoading(false));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post('/categories', { name, type, color, icon });
    setShowForm(false); setName(''); loadCategories();
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir categoria?')) return;
    await api.delete(`/categories/${id}`);
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  const filtered = filter === 'all' ? categories : categories.filter(c => c.type === filter);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Categorias</h1>
        <Button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem' }}>
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Fechar' : 'Nova'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da categoria" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="expense">Saída</option><option value="income">Entrada</option><option value="investment">Investimento</option>
              </select>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ height: '2.5rem', padding: '0.25rem', cursor: 'pointer' }} />
            </div>
            <Button type="submit" fullWidth>Criar Categoria</Button>
          </form>
        </Card>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {['all', 'income', 'expense', 'investment'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.375rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 500, border: 'none', cursor: 'pointer',
            background: filter === f ? 'var(--color-primary)' : 'var(--color-surface-2)',
            color: filter === f ? '#fff' : 'var(--color-text-muted)',
          }}>{{ all: 'Todas', income: 'Entradas', expense: 'Saídas', investment: 'Investimentos' }[f]}</button>
        ))}
      </div>

      {loading ? <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(c => (
            <Card key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: `${c.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tags size={16} style={{ color: c.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.name}</p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{{ income: 'Entrada', expense: 'Saída', investment: 'Investimento' }[c.type]}</p>
              </div>
              <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
