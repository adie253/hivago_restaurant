import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import SettingsPage from './pages/SettingsPage';
import PayoutsPage from './pages/PayoutsPage';
import OwnerOutletsPage from './pages/owner/OwnerOutletsPage';
import AdminCreateRestaurantPage from './pages/admin/AdminCreateRestaurantPage';
import AdminPayoutsPage from './pages/admin/AdminPayoutsPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const RequireAuth = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const hasRequiredRole = allowedRoles.includes(user.role) || (user.originalRole && allowedRoles.includes(user.originalRole));
    
    if (!hasRequiredRole) {
      if (user.role === 'owner') return <Navigate to="/owner/outlets" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const RedirectIfAuthenticated = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === 'owner') return <Navigate to="/owner/outlets" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const App = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showSidebar = location.pathname !== '/login';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
              {/* 🔥 Navbar (fixed on top) */}
              {showSidebar && (
                <header className="sticky top-0 z-50 flex-none">
                  <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
                </header>
              )}

              {/* 🔽 Bottom Section (Sidebar + Content) */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                {showSidebar && (
                  <aside className={`fixed inset-y-0 left-0 z-40 w-72 flex-none bg-white lg:static lg:block ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                  } transition-transform duration-300 ease-in-out`}>
                    <Sidebar
                      isOpen={sidebarOpen}
                      onDismiss={() => setSidebarOpen(false)}
                    />
                  </aside>
                )}

                {/* Overlay for mobile */}
                {showSidebar && sidebarOpen && (
                  <div
                    className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  />
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
                  <Routes>
                    <Route
                      path="/login"
                      element={
                        <RedirectIfAuthenticated>
                          <LoginPage />
                        </RedirectIfAuthenticated>
                      }
                    />

                    <Route
                      path="/dashboard"
                      element={
                        <RequireAuth allowedRoles={['restaurant']}>
                          <DashboardPage />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/owner/outlets"
                      element={
                        <RequireAuth allowedRoles={['owner']}>
                          <OwnerOutletsPage />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/admin/create-restaurant"
                      element={
                        <RequireAuth allowedRoles={['admin', 'owner']}>
                          <AdminCreateRestaurantPage />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/admin/payouts"
                      element={
                        <RequireAuth allowedRoles={['admin']}>
                          <AdminPayoutsPage />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/menu"
                      element={
                        <RequireAuth allowedRoles={['restaurant']}>
                          <MenuPage />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/payouts"
                      element={
                        <RequireAuth allowedRoles={['restaurant']}>
                          <PayoutsPage />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/settings"
                      element={
                        <RequireAuth allowedRoles={['restaurant']}>
                          <SettingsPage />
                        </RequireAuth>
                      }
                    />

                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
