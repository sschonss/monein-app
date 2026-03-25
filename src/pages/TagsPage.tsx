import { useState, useEffect, FormEvent } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Trash2, Tag, X } from 'lucide-react';
import api from '../lib/api';

interface TagItem { id: number; name: string; color: string; }

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => { loadTags(); }, []);

  async function loadTags() {
    setLoading(true);
    api.get('/tags').then(r => setTags(r.data.data || r.data)).finally(() => setLoading(false));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post('/tags', { name, color });
    setShowForm(false); setName(''); setColor('#6366f1'); loadTags();
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir tag?')) return;
    await api.delete(`/tags/${id}`);
    setTags(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tags</h1>
        <Button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem' }}>
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Fechar' : 'Nova'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}><input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da tag" required /></div>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '2.5rem', height: '2.5rem', padding: '0.25rem', cursor: 'pointer', borderRadius: '0.5rem' }} />
            <Button type="submit">Criar</Button>
          </form>
        </Card>
      )}

      {loading ? <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p> : tags.length === 0 ? (
        <EmptyState icon={Tag} title="Sem tags" description="Crie tags para organizar transações" />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tags.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: `${t.color}20`,
              padding: '0.5rem 0.75rem', borderRadius: '1rem', border: `1px solid ${t.color}40`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{t.name}</span>
              <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
