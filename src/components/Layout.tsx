import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, BarChart3, Landmark, Menu } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { path: '/investments', icon: Landmark, label: 'Investimentos' },
  { path: '/analytics', icon: BarChart3, label: 'Análise' },
  { path: '/menu', icon: Menu, label: 'Menu' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <main style={{ flex: 1, paddingBottom: '5rem', maxWidth: '512px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-surface-2)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: '512px', margin: '0 auto' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '0.5rem 0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontSize: '0.625rem',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'color 0.2s',
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
