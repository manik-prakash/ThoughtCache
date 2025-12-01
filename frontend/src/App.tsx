import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { ItemForm } from './pages/ItemForm';
import { ItemDetails } from './pages/ItemDetails';
import { PublicShared } from './pages/PublicShared';
import { Settings } from './pages/Settings';
import { AppShell } from './components/layout/AppShell';
import { Spinner } from './components/ui/Spinner';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-4 capitalize">{title}</h1>
      <p className="text-gray-600">This feature is coming soon!</p>
    </div>
  );
}

// Wrapper components that use React Router
function DashboardWrapper() {
  const navigate = useNavigate();
  
  return (
    <Dashboard 
      onNavigate={(view, id) => {
        if (view === 'new') navigate('/new');
        else if (view === 'edit' && id) navigate(`/edit/${id}`);
        else if (view === 'item' && id) navigate(`/item/${id}`);
      }} 
    />
  );
}

function ItemFormWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  return (
    <ItemForm 
      itemId={id} 
      onNavigate={() => navigate('/dashboard')} 
    />
  );
}

function ItemDetailsWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <Navigate to="/dashboard" replace />;

  return (
    <ItemDetails
      itemId={id}
      onNavigate={(view, itemId) => {
        if (view === 'dashboard') navigate('/dashboard');
        else if (view === 'edit' && itemId) navigate(`/edit/${itemId}`);
        else if (view === 'item' && itemId) navigate(`/item/${itemId}`);
      }}
    />
  );
}

function PublicSharedWrapper() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/" replace />;
  return <PublicShared slug={slug} />;
}

function AppRouter() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Public routes (no auth required, no AppShell)
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing onGetStarted={() => navigate('/signup')} />} />
        <Route path="/login" element={<Login onSwitchToSignup={() => navigate('/signup')} />} />
        <Route path="/signup" element={<Signup onSwitchToLogin={() => navigate('/login')} />} />
        <Route path="/shared/:slug" element={<PublicSharedWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Protected routes (wrapped in AppShell)
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardWrapper />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/new" 
          element={
            <ProtectedRoute>
              <ItemFormWrapper />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit/:id" 
          element={
            <ProtectedRoute>
              <ItemFormWrapper />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/item/:id" 
          element={
            <ProtectedRoute>
              <ItemDetailsWrapper />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/collections" 
          element={
            <ProtectedRoute>
              <ComingSoon title="Collections" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tags" 
          element={
            <ProtectedRoute>
              <ComingSoon title="Tags" />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}