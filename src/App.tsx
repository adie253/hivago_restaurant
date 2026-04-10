import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';

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
  const showSidebar = location.pathname !== '/login';

  return (
    <AuthProvider>
            {showSidebar && <Navbar />}
      <div className="min-h-screen bg-slate-50 md:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] flex-col gap-6 md:flex-row max-w-[1440px]">
          {showSidebar && <Sidebar />}
          <main className="min-w-0 flex-1">
            <Routes>
              <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
              <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
              <Route
                path="/menu"
                element={
                  <RequireAuth>
                    <div className="rounded-[32px] bg-white p-8 shadow-lg">Menu page coming soon.</div>
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <div className="rounded-[32px] bg-white p-8 shadow-lg">Settings page coming soon.</div>
                  </RequireAuth>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;
