import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import SettingsPage from './pages/SettingsPage';
import PayoutsPage from './pages/PayoutsPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const RedirectIfAuthenticated = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const App = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showSidebar = location.pathname !== '/login';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <AuthProvider>
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
                  <RequireAuth>
                    <DashboardPage />
                  </RequireAuth>
                }
              />



              <Route
                path="/menu"
                element={
                  <RequireAuth>
                    <MenuPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/payouts"
                element={
                  <RequireAuth>
                    <PayoutsPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/settings"
                element={
                  <RequireAuth>
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
    </AuthProvider>
  );
}
export default App;

