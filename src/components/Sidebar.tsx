import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import live_orders_icon from '../assets/live_orders_icon.svg';
import menu_icon from '../assets/menu_icon.svg';
import payout_icon from '../assets/payout_icon.svg';
import settings_icon from '../assets/settings_icon.svg';
import logout_icon from '../assets/logout_icon.svg';


const menuItems = [
  { label: 'Live Orders', path: '/dashboard', img: live_orders_icon, roles: ['restaurant'] },
  { label: 'Menu', path: '/menu', img: menu_icon, roles: ['restaurant'] },
  { label: 'Payouts', path: '/payouts', img: payout_icon, roles: ['restaurant'] },
  { label: 'Settings', path: '/settings', img: settings_icon, roles: ['restaurant'] },
  { label: 'My Outlets', path: '/owner/outlets', img: settings_icon, roles: ['owner'] },
  { label: 'Add Restaurant', path: '/admin/create-restaurant', img: settings_icon, roles: ['owner'] },
];

interface SidebarProps {
  isOpen?: boolean;
  onDismiss?: () => void;
}

const Sidebar = ({ isOpen = false, onDismiss }: SidebarProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col border-r border-slate-100 bg-white">
      <div className="p-6 md:hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Menu</p>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {menuItems
          .filter(item => !item.roles || (user && (item.roles.includes(user.role) || (user.originalRole && item.roles.includes(user.originalRole)))))
          .map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#FFF5F4] text-[#AD221F] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <img 
                src={item.img} 
                alt="" 
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110`} 
            />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
        >
          <img src={logout_icon} alt="" className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          Logout
        </button>
      </div>
    </div>
  );
};


export default Sidebar;
