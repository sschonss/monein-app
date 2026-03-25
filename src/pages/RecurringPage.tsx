import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Repeat, Trash2, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import api from '../lib/api';

interface RecurringTransaction {
  id: number;
  type: 'income' | 'expense' | 'investment';
  description: string;
  amount: number;
  currency: string;
  frequency: string;
  next_due_date: string;
  is_active: boolean;
  category?: { name: string; color: string; };
}

const typeIcons = { income: TrendingUp, expense: TrendingDown, investment: Landmark };
const typeColors = { income: 'var(--color-income)', expense: 'var(--color-expense)', investment: 'var(--color-investment)' };
const freqLabels: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal', yearly: 'Anual' };

export default function RecurringPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/recurring-transactions').then(r => setItems(r.data.data || r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  async function handleDelete(id: number) {
    if (!confirm('Excluir recorrente?')) return;
    await api.delete(`/recurring-transactions/${id}`);
    setItems(prev => prev.filter(t => t.id !== id));
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Recorrentes</h1>
        <Button onClick={() => navigate('/recurring/new')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem' }}>
          <Plus size={16} /> Nova
        </Button>
      </div>

      {loading ? <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p> : items.length === 0 ? (
        <EmptyState icon={Repeat} title="Sem recorrentes" description="Adicione transações que se repetem" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(t => {
            const Icon = typeIcons[t.type];
            return (
              <Card key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: t.is_active ? 1 : 0.5 }}>
                <div style={{ width: 36, height: 36, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${typeColors[t.type]}20` }}>
                  <Icon size={18} style={{ color: typeColors[t.type] }} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{freqLabels[t.frequency]} · Próx: {new Date(t.next_due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: typeColors[t.type] }}>{fmt(t.amount)}</span>
                  <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
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
