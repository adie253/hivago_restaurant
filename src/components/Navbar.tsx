import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import hivago_logo from '../assets/hivago_logo.svg';
import notification_icon from '../assets/notification_icon.svg';
import logout_icon from '../assets/logout_icon.svg';
import manage_outlet_icon from '../assets/manage_outlet_icon.svg';
import { useState, useEffect, useRef } from 'react';
import ManageOutletModal from './ManageOutletModal';
import { getOwnerOutlets, Outlet } from '../api/ownerApi';
import { updateRestaurantAvailability } from '../api/dashboardApi';
import { fetchRestaurantSettings } from '../api/dashboardApi';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
    const { logout, user, switchOutlet, resetToOwner } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isManageOutletOpen, setIsManageOutletOpen] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    
    // Switch Outlet Dropdown State
    const [isSwitchOutletOpen, setIsSwitchOutletOpen] = useState(false);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [loadingOutlets, setLoadingOutlets] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const isOwner = user?.role === 'owner' || user?.originalRole === 'owner';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSwitchOutletOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch initial status if user is in restaurant context
    useEffect(() => {
        let isMounted = true;
        
        if (user && (user.role === 'restaurant' || user.outletId)) {
            const getStatus = async () => {
                try {
                    const settings = await fetchRestaurantSettings();
                    if (isMounted) setIsOnline(settings.operations.isAcceptingOrders);
                } catch (error) {
                    console.error("Failed to fetch restaurant status:", error);
                    // On error, default to offline instead of infinite loading
                    if (isMounted) setIsOnline(false);
                }
            };
            getStatus();
        } else {
            setIsOnline(null);
        }

        return () => { isMounted = false; };
    }, [user?.id, user?.role, user?.outletId]);

    const handleSwitchOutletClick = async () => {
        if (!isSwitchOutletOpen) {
            setIsSwitchOutletOpen(true);
            if (outlets.length === 0) {
                setLoadingOutlets(true);
                try {
                    const data = await getOwnerOutlets();
                    setOutlets(data);
                } catch (error) {
                    console.error("Failed to fetch outlets:", error);
                    showToast("Failed to load outlets", "error");
                } finally {
                    setLoadingOutlets(false);
                }
            }
        } else {
            setIsSwitchOutletOpen(false);
        }
    };

    const handleSelectOutlet = async (outletId: string) => {
        const selectedOutlet = outlets.find(o => o.id === outletId);
        try {
            await switchOutlet(outletId);
            setIsSwitchOutletOpen(false);
            showToast(`Switched to ${selectedOutlet?.name || 'outlet'}`, 'success');
            navigate('/dashboard');
        } catch (error) {
            console.error("Failed to switch outlet:", error);
            showToast("Failed to switch outlet", "error");
        }
    };

    const handleLogout = () => {
        logout();
        showToast("Successfully logged out", "info");
        navigate('/login');
    };

    const handleToggleStatus = async () => {
        if (isUpdatingStatus || isOnline === null) return;
        
        setIsUpdatingStatus(true);
        try {
            const newStatus = !isOnline;
            await updateRestaurantAvailability(newStatus);
            setIsOnline(newStatus);
            showToast(`Store is now ${newStatus ? 'Online' : 'Offline'}`, 'info');
        } catch (error) {
            console.error("Failed to update status:", error);
            showToast("Failed to update availability", "error");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <nav className="bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3.5 shadow-lg sm:px-8">
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
                    {isOwner && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={handleSwitchOutletClick}
                                className="group inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-slate-50"
                            >
                                <svg className="mr-2.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Switch Outlet
                            </button>

                            {isSwitchOutletOpen && (
                                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in duration-200">
                                    <div className="px-3 py-2 border-b border-slate-100 mb-2">
                                        <h3 className="text-sm font-bold text-slate-900">Your Outlets</h3>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {loadingOutlets ? (
                                            <div className="flex justify-center p-4">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600"></div>
                                            </div>
                                        ) : outlets.length === 0 ? (
                                            <div className="text-center p-4 text-xs font-semibold text-slate-500">No outlets found</div>
                                        ) : (
                                            outlets.map((outlet) => (
                                                <button
                                                    key={outlet.id}
                                                    onClick={() => handleSelectOutlet(outlet.id)}
                                                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex flex-col"
                                                >
                                                    <span className="text-sm font-bold text-slate-900">{outlet.name}</span>
                                                    <span className="text-xs font-semibold text-slate-500 mt-0.5">{outlet.rstCode}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <div className="px-2 pt-2 mt-1 border-t border-slate-100">
                                        <button
                                            onClick={async () => {
                                                setIsSwitchOutletOpen(false);
                                                await resetToOwner();
                                                navigate('/owner/outlets');
                                            }}
                                            className="w-full text-center px-3 py-2 rounded-lg text-xs font-bold text-brand-600 hover:bg-red-50 transition-colors"
                                        >
                                            Manage All Outlets
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {isOwner && (
                        <button
                            type="button"
                            onClick={() => setIsManageOutletOpen(true)}
                            className="group inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-slate-50"
                        >
                            <img src={manage_outlet_icon} className="mr-2.5 h-4 w-4" alt="" />
                            Manage Outlets
                            <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}

                    <div className="flex items-center gap-1 sm:gap-3">
                        {(user && (user.role === 'restaurant' || user.outletId)) && (
                            <button
                                type="button"
                                onClick={handleToggleStatus}
                                disabled={isUpdatingStatus || isOnline === null}
                                className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 ${
                                    isOnline === null 
                                        ? 'bg-white/10 text-white/50 border border-white/10'
                                        : isOnline 
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20' 
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {isOnline === null ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                        <span>...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                                    </>
                                )}
                                {isUpdatingStatus && (
                                    <div className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                )}
                            </button>
                        )}

                        <button
                            type="button"
                            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                            aria-label="Notifications"
                        >
                            <img src={notification_icon} className="h-8 w-8" alt="" />
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
                            <img src={logout_icon} className="h-8 w-8" alt="" />
                        </button>
                    </div>
                </div>
            </div>

            <ManageOutletModal 
                isOpen={isManageOutletOpen} 
                onClose={() => setIsManageOutletOpen(false)} 
            />
        </nav>
    );
};

export default Navbar;
