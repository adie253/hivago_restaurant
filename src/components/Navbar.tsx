import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import hivago_logo from '../assets/hivago_logo.svg';
import notification_icon from '../assets/notification_icon.svg';
import logout_icon from '../assets/logout_icon.svg';
import manage_outlet_icon from '../assets/manage_outlet_icon.svg';

const Navbar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="mb-6 bg-gradient-to-r from-[#CE3C2F] to-[#AD221F] px-4 py-3 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 text-white">
                    <div>
                        <img src={hivago_logo} className='' alt="Hivago Logo" />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-3xl bg-white px-4 py-2 text-[#AD221F] text-sm font-medium transition mr-8"
                    >
                        <img src={manage_outlet_icon} className='mr-2' alt="" />
                        Manage outlets
                        <span className="ml-2 text-xs">▾</span>
                    </button>

                    <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-3xl text-white transition hover:bg-white/20"
                        aria-label="Notifications"
                    >
                        <img src={notification_icon} alt="" />
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex h-11 mt-1 w-11 items-center justify-center rounded-3xl p-1 transition hover:bg-white/20"
                    >
                        <img src={logout_icon} alt="" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
