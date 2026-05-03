// src/App.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ModulesPage } from './pages/admin/ModulesPage';
import { LessonsPage } from './pages/LessonPage';
import { PendingReviewPage } from './pages/admin/PendingReviewPage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  adminOnly?: boolean;
}> = ({ children, adminOnly = false }) => {
  const { currentUser, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50/80">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-purple-600" />
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { currentUser, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50/80">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-purple-600" />
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/modules"
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout>
              <ModulesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/*
        Module-scoped lessons: admins drill in from /modules to see the
        lessons that belong to a single module.
      */}
      <Route
        path="/modules/:moduleId/lessons"
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout>
              <LessonsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/*
        Teachers still have a flat "My Lessons" view (they don't own modules).
        Admins who hit this URL directly get bounced to /modules instead —
        there is no unfiltered admin lesson list anymore.
      */}
      <Route
        path="/lessons"
        element={
          <ProtectedRoute>
            {isAdmin ? (
              <Navigate to="/modules" replace />
            ) : (
              <DashboardLayout>
                <LessonsPage />
              </DashboardLayout>
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path="/pending"
        element={
          <ProtectedRoute adminOnly>
            <DashboardLayout>
              <PendingReviewPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;