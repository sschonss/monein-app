import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import UpdatePrompt from './components/UpdatePrompt';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const TransactionFormPage = lazy(() => import('./pages/TransactionFormPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const RecurringPage = lazy(() => import('./pages/RecurringPage'));
const RecurringFormPage = lazy(() => import('./pages/RecurringFormPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const TagsPage = lazy(() => import('./pages/TagsPage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));

function Loading() {
  return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50dvh', color: 'var(--color-text-muted)' }}>Carregando...</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UpdatePrompt />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="transactions/new" element={<TransactionFormPage />} />
              <Route path="transactions/:id/edit" element={<TransactionFormPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="recurring" element={<RecurringPage />} />
              <Route path="recurring/new" element={<RecurringFormPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="tags" element={<TagsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="import" element={<ImportPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
