import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { label: 'Live Orders', path: '/dashboard' },
  { label: 'Menu', path: '/menu' },
  { label: 'Payout', path: '/payout ' },
  { label: 'Settings', path: '/settings' }
];

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden h-full w-72 shrink-0 rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:flex md:flex-col md:block">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg">
          H
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Hivago</p>
          <h2 className="text-lg font-semibold text-slate-900">Restaurant Dashboard</h2>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
