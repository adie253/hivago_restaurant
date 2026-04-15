import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import hivago_logo from '../assets/hivago_logo.svg';
import notification_icon from '../assets/notification_icon.svg';
import logout_icon from '../assets/logout_icon.svg';
import manage_outlet_icon from '../assets/manage_outlet_icon.svg';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-gradient-to-r from-[#C2352B] to-[#AD221F] px-4 py-3.5 shadow-lg sm:px-8">
            <div className="mx-auto flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
                        aria-label="Open sidebar"
                    >
                        <span className="text-xl">☰</span>
                    </button>
                    <div className="flex items-center">
                        <img src={hivago_logo} className="h-8 w-auto" alt="Hivago Logo" />
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-6">
                    <button
                        type="button"
                        className="group inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#AD221F] shadow-sm transition hover:bg-slate-50"
                    >
                        <img src={manage_outlet_icon} className="mr-2.5 h-4 w-4" alt="" />
                        Manage Outlets
                        <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-1 sm:gap-3">
                        <button
                            type="button"
                            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                            aria-label="Notifications"
                        >
                            <img src={notification_icon} className="h-6 w-6" alt="" />
                            <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500"></span>
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                            aria-label="Logout"
                        >
                            <img src={logout_icon} className="h-6 w-6" alt="" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};


export default Navbar;
