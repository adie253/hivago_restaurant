import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import live_orders_icon from '../assets/live_orders_icon.svg';
import menu_icon from '../assets/menu_icon.svg';
import payout_icon from '../assets/payout_icon.svg';
import settings_icon from '../assets/settings_icon.svg';
import logout_icon from '../assets/logout_icon.svg';
import manage_outlet_icon from '../assets/manage_outlet_icon.svg';


const menuItems = [
  { label: 'Live Orders', path: '/dashboard', img: live_orders_icon, roles: ['restaurant'] },
  { label: 'Menu', path: '/menu', img: menu_icon, roles: ['restaurant'] },
  { label: 'Payouts', path: '/payouts', img: payout_icon, roles: ['restaurant', 'owner'] },
  { label: 'Settings', path: '/settings', img: settings_icon, roles: ['restaurant'] },
  // { label: 'My Outlets', path: '/owner/outlets', img: manage_outlet_icon, roles: ['owner'] },
  { label: 'Control Center', path: '/admin/payouts', img: payout_icon, roles: ['admin'] },
  { label: 'Add Restaurant', path: '/admin/create-restaurant', img: settings_icon, roles: ['admin'] },
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
          .filter(item => {
            if (!user) return false;
            if (!item.roles) return true;
            
            // Strictly hide 'Add Restaurant' if we are currently in a restaurant context
            if (item.label === 'Add Restaurant' && user.role === 'restaurant') return false;
            
            return item.roles.includes(user.role) || (user.originalRole && item.roles.includes(user.originalRole));
          })
          .map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-brand-50 text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <div 
                className="h-5 w-5 flex-shrink-0 bg-current transition-transform duration-200 group-hover:scale-110"
                style={{ 
                    WebkitMask: `url("${item.img}") center/contain no-repeat`,
                    mask: `url("${item.img}") center/contain no-repeat`,
                }} 
            />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-50 p-4 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-50 shadow-sm">
          <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {(user?.ownerName || user?.name || '?').charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">
              {user?.ownerName || user?.name}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 truncate">
              {user?.ownerEmail || user?.email}
            </p>
          </div>
        </div>

        <a 
          href="https://wa.me/919082220155?text=Need%20HELP!" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-600 transition-all hover:bg-emerald-50 hover:text-emerald-600"
        >
          <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          Help & Support
        </a>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-600 transition-all hover:bg-brand-50 hover:text-brand-600"
        >
          <div 
            className="h-5 w-5 flex-shrink-0 bg-current transition-transform group-hover:scale-110"
            style={{ 
                WebkitMask: `url("${logout_icon}") center/contain no-repeat`,
                mask: `url("${logout_icon}") center/contain no-repeat`,
            }} 
          />

          Logout
        </button>
      </div>
    </div>
  );
};


export default Sidebar;
