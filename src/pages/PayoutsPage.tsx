import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PayoutCycle, PayoutSummary } from '../types';
import { fetchPayoutSummary } from '../api/payoutsApi';
import { useToast } from '../context/ToastContext';
import { PayoutsPageSkeleton } from '../components/Skeletons';

const PayoutsPage = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [payouts, setPayouts] = useState<PayoutSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [availableOutlets, setAvailableOutlets] = useState<any[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<'all' | string>(user?.id || 'all');
    const [selectedOutletName, setSelectedOutletName] = useState('All Restaurants');
    const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '22 Feb, 2026', end: '22 Mar, 2026' });
    const [viewDate, setViewDate] = useState(new Date(2026, 1, 1)); // Feb 2026
    const [selection, setSelection] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });

    // Calendar Helpers 
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleMonthChange = (offset: number) => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

        if (!selection.start || (selection.start && selection.end)) {
            setSelection({ start: clickedDate, end: null });
        } else {
            if (clickedDate < selection.start) {
                setSelection({ start: clickedDate, end: selection.start });
            } else {
                setSelection({ ...selection, end: clickedDate });
            }

            // Format and update main range
            const startStr = clickedDate < selection.start ? formatDate(clickedDate) : formatDate(selection.start);
            const endStr = clickedDate < selection.start ? formatDate(selection.start) : formatDate(clickedDate);
            setDateRange({ start: startStr, end: endStr });
            setIsCalendarOpen(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const isDateSelected = (day: number) => {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return (selection.start?.getTime() === d.getTime()) || (selection.end?.getTime() === d.getTime());
    };

    const isDateInRange = (day: number) => {
        if (!selection.start || !selection.end) return false;
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return d > selection.start && d < selection.end;
    };

    useEffect(() => {
        if (user?.role === 'owner') {
            const fetchOutlets = async () => {
                const { getOwnerOutlets } = await import('../api/ownerApi');
                try {
                    const data = await getOwnerOutlets();
                    setAvailableOutlets(data);
                    // Default to 'all' if owner
                    setSelectedOutletId('all');
                    setSelectedOutletName('All Restaurants');
                } catch (error) {
                    console.error("Failed to fetch outlets:", error);
                }
            };
            fetchOutlets();
        }
    }, [user?.role]);

    useEffect(() => {
        if (!user?.id && selectedOutletId !== 'all') return;

        const loadPayouts = async () => {
            setLoading(true);
            try {
                if (selectedOutletId === 'all' && availableOutlets.length > 0) {
                    const allData = await Promise.all(availableOutlets.map(o =>
                        fetchPayoutSummary(o.id).then(data => ({
                            currentCycle: { ...data.currentCycle, restaurantName: o.name },
                            pastCycles: data.pastCycles.map(pc => ({ ...pc, restaurantName: o.name }))
                        }))
                    ));

                    const consolidated: PayoutSummary = {
                        currentCycle: {
                            id: 'consolidated-current',
                            cycleRange: allData[0]?.currentCycle.cycleRange || "23 - 29 Mar'26",
                            payoutDate: allData[0]?.currentCycle.payoutDate || "01 Apr'26",
                            ordersCount: allData.reduce((sum, d) => sum + d.currentCycle.ordersCount, 0),
                            amount: allData.reduce((sum, d) => sum + d.currentCycle.amount, 0),
                            status: 'UPCOMING',
                            restaurantName: 'All Restaurants'
                        },
                        pastCycles: allData.flatMap(d => d.pastCycles)
                    };
                    setPayouts(consolidated);
                } else if (selectedOutletId !== 'all') {
                    const data = await fetchPayoutSummary(selectedOutletId);
                    setPayouts(data);
                }
            } catch (err) {
                console.error('Failed to load payouts', err);
                showToast('Failed to load payouts history', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadPayouts();
    }, [user?.id, selectedOutletId, availableOutlets]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (loading) return <PayoutsPageSkeleton />;

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Payouts</h1>
                    <p className="text-sm font-bold text-slate-400">Track your earnings and payout history</p>
                </div>

                {user?.role === 'owner' && (
                    <div className="relative">
                        <button
                            onClick={() => setIsOutletDropdownOpen(!isOutletDropdownOpen)}
                            className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all hover:border-[#AD221F]/20 hover:shadow-md"
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            {selectedOutletName}
                            <svg className={`h-4 w-4 text-slate-400 transition-transform ${isOutletDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isOutletDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 transform overflow-hidden rounded-2xl border border-slate-50 bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all z-10">
                                <button
                                    className="block w-full px-5 py-3.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#AD221F]"
                                    onClick={() => {
                                        setSelectedOutletId('all');
                                        setSelectedOutletName('All Restaurants');
                                        setIsOutletDropdownOpen(false);
                                    }}
                                >
                                    All Restaurants
                                </button>
                                {availableOutlets.map((outlet) => (
                                    <button
                                        key={outlet.id}
                                        className="block w-full px-5 py-3.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#AD221F]"
                                        onClick={() => {
                                            setSelectedOutletId(outlet.id);
                                            setSelectedOutletName(outlet.name);
                                            setIsOutletDropdownOpen(false);
                                        }}
                                    >
                                        {outlet.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Current Cycle Card */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 px-1">Current cycle</h2>
                <div className="rounded-[32px] bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
                    <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-20">
                        {/* Cycle Range */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payout cycle</p>
                            <p className="text-lg font-black text-slate-900">{payouts?.currentCycle.cycleRange}</p>
                        </div>

                        {/* Payout Date */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payout date</p>
                            <p className="text-lg font-black text-slate-900">{payouts?.currentCycle.payoutDate}</p>
                        </div>

                        {/* Orders Count */}
                        <div className="space-y-2 text-center md:text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orders</p>
                            <p className="text-lg font-black text-slate-900">{payouts?.currentCycle.ordersCount}</p>
                        </div>

                        {/* Est Payout */}
                        <div className="space-y-2 md:text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Est. payout ({payouts?.currentCycle.cycleRange.split(' - ')[0]})</p>
                            <div className="flex items-center gap-3 md:justify-end">
                                <p className="text-2xl font-black text-slate-900">{formatCurrency(payouts?.currentCycle.amount || 0)}</p>
                                <div className="flex gap-2 text-slate-400">
                                    <button
                                        className="hover:text-slate-600 transition-colors"
                                        title="Copy UTR"
                                        onClick={() => {
                                            navigator.clipboard.writeText('UTR' + Math.random().toString(36).substring(7).toUpperCase());
                                            showToast('UTR copied to clipboard', 'info');
                                        }}
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                        </svg>
                                    </button>
                                    <button
                                        className="hover:text-slate-600 transition-colors"
                                        title="Download Details"
                                        onClick={() => showToast('Statement download started', 'success')}
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4-4v12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Past Cycles History */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Past cycles</h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-2.5 text-sm font-bold text-slate-400 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {dateRange.start} - {dateRange.end}
                            </button>

                            {isCalendarOpen && (
                                <div className="absolute right-0 mt-2 w-[320px] bg-white rounded-3xl border border-slate-50 shadow-2xl p-6 z-20">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-black text-slate-900">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleMonthChange(-1)}
                                                className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleMonthChange(1)}
                                                className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-y-2 mb-2">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                            <div key={day} className="text-[10px] font-black text-slate-300 text-center uppercase tracking-widest">{day}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-y-1">
                                        {/* Empty slots for start of month */}
                                        {Array.from({ length: getFirstDayOfMonth(viewDate) }).map((_, i) => (
                                            <div key={`empty-${i}`} />
                                        ))}

                                        {/* Days in month */}
                                        {Array.from({ length: getDaysInMonth(viewDate) }).map((_, i) => {
                                            const day = i + 1;
                                            const selected = isDateSelected(day);
                                            const inRange = isDateInRange(day);
                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => handleDateClick(day)}
                                                    className={`h-9 w-9 flex items-center justify-center rounded-full text-xs font-bold transition-all relative
                                                        ${selected ? 'bg-[#008080] text-white shadow-lg shadow-teal-100 z-10' : 'text-slate-600 hover:bg-slate-50'}
                                                    `}
                                                >
                                                    {inRange && (
                                                        <div className="absolute inset-0 bg-teal-50/50 -mx-0.5" />
                                                    )}
                                                    <span className="relative z-10">{day}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => showToast('Full report generated and ready for download', 'success')}
                            className="rounded-2xl bg-[#AD221F] px-8 py-3 text-sm font-black text-white shadow-xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-2xl active:scale-95"
                        >
                            Get report
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-hidden rounded-[32px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/30">
                                {selectedOutletId === 'all' && (
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Restaurant</th>
                                )}
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Payout Cycle</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Payout Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Orders</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Payout</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">UTR</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payouts?.pastCycles.map((cycle) => (
                                <tr key={cycle.id} className="group hover:bg-slate-50/50 transition-all">
                                    {selectedOutletId === 'all' && (
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-900">{cycle.restaurantName || '-'}</p>
                                        </td>
                                    )}
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-slate-900 group-hover:text-[#AD221F] transition-colors">{cycle.cycleRange}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-slate-600">{cycle.payoutDate}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            {cycle.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 font-bold text-slate-600">{cycle.ordersCount}</td>
                                    <td className="px-8 py-6 font-black text-slate-900">{formatCurrency(cycle.amount)}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 group/utr cursor-pointer">
                                            <p className="text-sm font-black tracking-tight text-slate-400 group-hover/utr:text-slate-600 transition-colors uppercase">{cycle.utr}</p>
                                            <svg className="h-4 w-4 text-slate-300 opacity-0 group-hover/utr:opacity-100 transition-all hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                            </svg>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 text-slate-400">
                                            <button className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white hover:text-[#AD221F] hover:shadow-sm" title="View Report">
                                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </button>
                                            <button className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white hover:text-emerald-500 hover:shadow-sm" title="Download Statement">
                                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4-4v12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PayoutsPage;
