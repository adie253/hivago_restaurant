import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    EarningsSummaryDto, 
    PayoutDto, 
    PayoutDetailDto, 
    GstSummaryDto, 
    TdsSummaryDto 
} from '../types';
import { 
    fetchEarningsSummary, 
    fetchPayoutHistory, 
    fetchPayoutDetail,
    fetchGstSummary,
    fetchTdsSummary
} from '../api/payoutsApi';
import { useToast } from '../context/ToastContext';
import { PayoutsPageSkeleton } from '../components/Skeletons';
import PayoutDetailsModal from '../components/PayoutDetailsModal';
import { formatCurrency } from '../utils/format';

type PayoutTab = 'earnings' | 'history' | 'tax-reports';

const PayoutsPage = () => {

    const { user } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<PayoutTab>('earnings');
    const [loading, setLoading] = useState(true);
    
    // Data States
    const [earnings, setEarnings] = useState<EarningsSummaryDto | null>(null);
    const [history, setHistory] = useState<PayoutDto[]>([]);
    const [gstSummary, setGstSummary] = useState<GstSummaryDto | null>(null);
    const [tdsSummary, setTdsSummary] = useState<TdsSummaryDto | null>(null);
    
    // Detail Modal State
    const [selectedPayout, setSelectedPayout] = useState<PayoutDetailDto | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Date Range for Tax Reports
    const [taxDateRange, setTaxDateRange] = useState(() => {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        
        // Don't let default date go before 01 Jan 2026
        const minDate = new Date('2026-01-01');
        const defaultFrom = oneWeekAgo < minDate ? minDate : oneWeekAgo;

        return {
            from: defaultFrom.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0]
        };
    });

    // Filtered GST Summary based on date range selection
    const filteredGstSummary = useMemo(() => {
        if (!gstSummary) return null;
        const lineItems = gstSummary.lineItems.filter((item: any) => {
            const date = (item.orderDate || item.createdAt || '').split('T')[0];
            return date >= taxDateRange.from && date <= taxDateRange.to;
        });

        const grossOrderAmount = lineItems.reduce((sum, item: any) => sum + (item.grossAmount || item.orderAmount || 0), 0);
        const totalGstOnOrders = lineItems.reduce((sum, item: any) => sum + (item.gstOnOrder || item.gstAmount || 0), 0);
        const totalCommission = lineItems.reduce((sum, item: any) => sum + (item.commission || item.commissionAmount || 0), 0);
        const totalCommissionGst = lineItems.reduce((sum, item: any) => sum + (item.commissionGst || 0), 0);

        return {
            fromDate: taxDateRange.from,
            toDate: taxDateRange.to,
            orderCount: lineItems.length,
            grossOrderAmount,
            totalGstOnOrders,
            totalCommission,
            totalCommissionGst,
            lineItems
        };
    }, [gstSummary, taxDateRange.from, taxDateRange.to]);

    // Filtered TDS Summary based on date range selection
    const filteredTdsSummary = useMemo(() => {
        if (!tdsSummary) return null;
        const lineItems = tdsSummary.lineItems.filter((item: any) => {
            const date = (item.orderDate || item.createdAt || '').split('T')[0];
            return date >= taxDateRange.from && date <= taxDateRange.to;
        });

        const grossOrderAmount = lineItems.reduce((sum, item: any) => sum + (item.grossAmount || item.orderAmount || 0), 0);
        const totalCommission = lineItems.reduce((sum, item: any) => sum + (item.commission || item.commissionAmount || 0), 0);
        const totalTdsDeducted = lineItems.reduce((sum, item: any) => sum + (item.tdsDeducted || item.tdsAmount || 0), 0);
        const netAfterTds = lineItems.reduce((sum, item: any) => sum + (item.netAfterTds || item.netAmount || 0), 0);

        return {
            fromDate: taxDateRange.from,
            toDate: taxDateRange.to,
            orderCount: lineItems.length,
            grossOrderAmount,
            totalCommission,
            totalTdsDeducted,
            netAfterTds,
            lineItems
        };
    }, [tdsSummary, taxDateRange.from, taxDateRange.to]);

    // Outlet Selection (for Owners)
    const [availableOutlets, setAvailableOutlets] = useState<any[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<'all' | string>(user?.role === 'owner' ? 'all' : (user?.id || ''));
    const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false);

    useEffect(() => {
        if (user?.role === 'owner') {
            const fetchOutlets = async () => {
                const { getOwnerOutlets } = await import('../api/ownerApi');
                try {
                    const data = await getOwnerOutlets();
                    setAvailableOutlets(data);
                } catch (error) {
                    console.error("Failed to fetch outlets:", error);
                }
            };
            fetchOutlets();
        }
    }, [user?.role]);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Fetch basic earnings and history on load
                const [earningsData, historyData] = await Promise.all([
                    fetchEarningsSummary(),
                    fetchPayoutHistory(1, 50)
                ]);
                setEarnings(earningsData);
                setHistory(historyData);
            } catch (err) {
                console.error('Failed to load payouts', err);
                showToast('Unable to load payouts data', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const handleFetchTaxReports = async () => {
        if (taxDateRange.from < '2026-01-01' || taxDateRange.to < '2026-01-01') {
            showToast('Date range cannot start before 01 Jan 2026', 'error');
            return;
        }
        try {
            const [gst, tds] = await Promise.all([
                fetchGstSummary(taxDateRange.from, taxDateRange.to),
                fetchTdsSummary(taxDateRange.from, taxDateRange.to)
            ]);
            setGstSummary(gst);
            setTdsSummary(tds);
            showToast('Tax reports updated', 'success');
        } catch (err) {
            showToast('Failed to fetch tax reports', 'error');
        }
    };

    const downloadGstCsv = () => {
        if (!filteredGstSummary || filteredGstSummary.lineItems.length === 0) {
            showToast('No GST transactions to download', 'warning');
            return;
        }
        const headers = ['Order Number', 'Date', 'Gross Amount', 'GST on Order', 'Commission', 'Commission GST'];
        const escapeCsvCell = (val: any) => {
            const str = String(val === null || val === undefined ? '' : val);
            return `"${str.replace(/"/g, '""')}"`;
        };
        const rows = filteredGstSummary.lineItems.map((item: any) => [
            `#${item.orderNumber || 'N/A'}`,
            new Date(item.orderDate || item.createdAt).toLocaleDateString(),
            item.grossAmount || item.orderAmount || 0,
            item.gstOnOrder || item.gstAmount || 0,
            item.commission || item.commissionAmount || 0,
            item.commissionGst || 0
        ].map(escapeCsvCell));
        
        const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `gst_report_${taxDateRange.from}_to_${taxDateRange.to}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadTdsCsv = () => {
        if (!filteredTdsSummary || filteredTdsSummary.lineItems.length === 0) {
            showToast('No TDS transactions to download', 'warning');
            return;
        }
        const headers = ['Order Number', 'Date', 'Gross Amount', 'Commission', 'TDS Deducted', 'Net Receivable'];
        const escapeCsvCell = (val: any) => {
            const str = String(val === null || val === undefined ? '' : val);
            return `"${str.replace(/"/g, '""')}"`;
        };
        const rows = filteredTdsSummary.lineItems.map((item: any) => [
            `#${item.orderNumber || 'N/A'}`,
            new Date(item.orderDate || item.createdAt).toLocaleDateString(),
            item.grossAmount || item.orderAmount || 0,
            item.commission || item.commissionAmount || 0,
            item.tdsDeducted || item.tdsAmount || 0,
            item.netAfterTds || item.netAmount || 0
        ].map(escapeCsvCell));
        
        const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tds_report_${taxDateRange.from}_to_${taxDateRange.to}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewDetail = async (payoutId: string) => {
        try {
            const detail = await fetchPayoutDetail(payoutId);
            setSelectedPayout(detail);
            setIsDetailModalOpen(true);
        } catch (err) {
            showToast('Failed to load payout details', 'error');
        }
    };

    // Filtered Ledger Entries based on outlet selection
    const filteredLedgerEntries = useMemo(() => {
        if (!earnings) return [];
        if (user?.role === 'restaurant') return earnings.ledgerEntries; // Already filtered by JWT
        if (selectedOutletId === 'all') return earnings.ledgerEntries;
        
        // Note: In real scenarios, ledger entries would need a restaurantId/outletId to filter
        // If the API doesn't provide it, we might need to assume it's already filtered or handle it
        return earnings.ledgerEntries; 
    }, [earnings, selectedOutletId, user?.role]);

    if (loading) return <PayoutsPageSkeleton />;

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Settlements</h1>
                    <p className="text-sm font-semibold text-slate-400">Track your earnings and weekly payouts</p>
                </div>

                {user?.role === 'owner' && (
                    <div className="relative">
                        <button
                            onClick={() => setIsOutletDropdownOpen(!isOutletDropdownOpen)}
                            className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            {selectedOutletId === 'all' ? 'All Restaurants' : availableOutlets.find(o => o.id === selectedOutletId)?.name || 'Select Outlet'}
                            <svg className={`h-4 w-4 text-slate-400 transition-transform ${isOutletDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isOutletDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 transform overflow-hidden rounded-[24px] border border-slate-50 bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-[60] animate-in slide-in-from-top-2 duration-200">
                                <button
                                    className="block w-full px-5 py-4 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#AD221F]"
                                    onClick={() => {
                                        setSelectedOutletId('all');
                                        setIsOutletDropdownOpen(false);
                                    }}
                                >
                                    All Restaurants
                                </button>
                                {availableOutlets.map((outlet) => (
                                    <button
                                        key={outlet.id}
                                        className="block w-full px-5 py-4 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#AD221F]"
                                        onClick={() => {
                                            setSelectedOutletId(outlet.id);
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

            {/* Tabs */}
            <div className="flex gap-2 rounded-[24px] bg-slate-100 p-1.5 w-fit">
                {(['earnings', 'history', 'tax-reports'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-[18px] px-8 py-2 text-xs font-bold tracking-widest uppercase transition-all ${
                            activeTab === tab 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>



            {/* Tab Content */}
            <div className="space-y-8">
                {activeTab === 'earnings' && earnings && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-50">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Gross Revenue</p>
                                <p className="text-3xl font-bold text-slate-900">{formatCurrency(earnings.grossRevenue)}</p>
                                <p className="mt-2 text-xs font-bold text-slate-400">Total order value</p>
                            </div>
                            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-50">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Platform Fees</p>
                                <p className="text-3xl font-bold text-red-500">-{formatCurrency(earnings.totalCommission)}</p>
                                <p className="mt-2 text-xs font-bold text-slate-400">Commission & Service GST</p>
                            </div>
                            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-50">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">TDS (1%)</p>
                                <p className="text-3xl font-bold text-orange-500">-{formatCurrency(earnings.totalTds)}</p>
                                <p className="mt-2 text-xs font-bold text-slate-400">Sec 194-O deduction</p>
                            </div>
                            <div className="rounded-[32px] bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-xl">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">Net Earnings</p>
                                <p className="text-3xl font-bold text-white">{formatCurrency(earnings.netEarnings)}</p>
                                <p className="mt-2 text-xs font-bold text-white/40">Current week (Mon - Today)</p>
                            </div>
                        </div>

                        {/* Recent Ledger Entries */}
                        <div className="rounded-[32px] bg-white shadow-sm border border-slate-50 overflow-hidden">
                            <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">Current Week Orders</h3>
                                <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-600">
                                    {earnings.orderCount} orders
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order #</th>
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">GST</th>
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Comm.</th>
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">TDS</th>
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Net</th>
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                         {filteredLedgerEntries.map((entry) => {
                                             const displayNum = entry.orderNumber || (entry as any).orderNo || (entry as any).order_number || (entry as any).orderCode || (entry as any).orderId || entry.orderId || 'N/A';
                                             const formattedNum = String(displayNum).startsWith('#') ? displayNum : `#${displayNum}`;
                                             return (
                                             <tr key={entry.orderId} className="hover:bg-slate-50/50 transition-colors">
                                                 <td className="px-8 py-4 text-sm font-bold text-slate-900">{formattedNum}</td>
                                                <td className="px-8 py-4 text-sm font-bold text-slate-600">{formatCurrency(entry.orderAmount)}</td>
                                                <td className="px-8 py-4 text-sm font-bold text-slate-600">{formatCurrency(entry.gstAmount)}</td>
                                                <td className="px-8 py-4 text-sm font-bold text-red-400">-{formatCurrency(entry.commissionAmount + entry.commissionGst)}</td>
                                                <td className="px-8 py-4 text-sm font-bold text-orange-400">-{formatCurrency(entry.tdsAmount)}</td>
                                                <td className="px-8 py-4 text-sm font-bold text-slate-900">{formatCurrency(entry.netAmount)}</td>
                                                <td className="px-8 py-4">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold tracking-widest text-amber-600 uppercase">
                                                        {entry.status}
                                                    </span>
                                                </td>
                                            </tr>
                                             );
                                         })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="rounded-[32px] bg-white shadow-sm border border-slate-50 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Period</th>
                                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Orders</th>
                                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Amount</th>
                                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Paid On</th>
                                        <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {history.map((payout) => (
                                        <tr key={payout.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => handleViewDetail(payout.id)}>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-slate-900">{payout.periodStart} - {payout.periodEnd}</p>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-600">{payout.orderCount}</td>
                                            <td className="px-8 py-6 text-lg font-bold text-slate-900">{formatCurrency(payout.netPayoutAmount)}</td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${
                                                    payout.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full ${payout.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                                    {payout.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-400">
                                                {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 active:scale-95 cursor-pointer">
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'tax-reports' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Filter Bar */}
                        <div className="flex flex-wrap items-end gap-4 rounded-[32px] bg-white p-8 shadow-sm border border-slate-50">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">From Date</label>
                                <input 
                                    type="date" 
                                    value={taxDateRange.from}
                                    min="2026-01-01"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val && val < '2026-01-01') {
                                            showToast('Date cannot be before 01 Jan 2026', 'warning');
                                            return;
                                        }
                                        setTaxDateRange(prev => ({ ...prev, from: val }));
                                    }}
                                    className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-[#AD221F] outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">To Date</label>
                                <input 
                                    type="date" 
                                    value={taxDateRange.to}
                                    min="2026-01-01"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val && val < '2026-01-01') {
                                            showToast('Date cannot be before 01 Jan 2026', 'warning');
                                            return;
                                        }
                                        setTaxDateRange(prev => ({ ...prev, to: val }));
                                    }}
                                    className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-[#AD221F] outline-none transition-all"
                                />
                            </div>
                            <button 
                                onClick={handleFetchTaxReports}
                                className="rounded-2xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100"
                            >
                                Generate Reports
                            </button>
                        </div>

                        {/* GST Summary Card */}
                        {filteredGstSummary && (
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-50">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6">GST Report</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-50/50">
                                            <span className="text-sm font-bold text-emerald-700">GST Collected on Food</span>
                                            <span className="text-lg font-bold text-emerald-900">{formatCurrency(filteredGstSummary.totalGstOnOrders)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50">
                                            <span className="text-sm font-bold text-slate-600">GST on Rally Commission</span>
                                            <span className="text-lg font-bold text-slate-900">{formatCurrency(filteredGstSummary.totalCommissionGst)}</span>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex justify-between">
                                            <span className="text-xs font-bold text-slate-400">{filteredGstSummary.orderCount} orders processed</span>
                                            <button 
                                                onClick={downloadGstCsv}
                                                className="text-xs font-bold text-[#AD221F] uppercase tracking-widest hover:underline"
                                            >
                                                Download CSV
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {filteredTdsSummary && (
                                    <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-50">
                                        <h3 className="text-lg font-bold text-slate-900 mb-6">TDS Report (Sec 194-O)</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-4 rounded-2xl bg-orange-50/50">
                                                <span className="text-sm font-bold text-orange-700">Total TDS Deducted (1%)</span>
                                                <span className="text-lg font-bold text-orange-900">{formatCurrency(filteredTdsSummary.totalTdsDeducted)}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50">
                                                <span className="text-sm font-bold text-slate-600">Net Receivable after TDS</span>
                                                <span className="text-lg font-bold text-slate-900">{formatCurrency(filteredTdsSummary.netAfterTds)}</span>
                                            </div>
                                            <div className="pt-4 border-t border-slate-50 flex justify-between">
                                                <span className="text-xs font-bold text-slate-400">For {filteredTdsSummary.grossOrderAmount.toLocaleString()} gross sales</span>
                                                <button 
                                                    onClick={downloadTdsCsv}
                                                    className="text-xs font-bold text-[#AD221F] uppercase tracking-widest hover:underline"
                                                >
                                                    Download CSV
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* GST line items table */}
                        {filteredGstSummary && filteredGstSummary.lineItems && filteredGstSummary.lineItems.length > 0 && (
                            <div className="rounded-[32px] bg-white shadow-sm border border-slate-50 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-50">
                                    <h3 className="text-lg font-bold text-slate-900">GST Transactions Log</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order #</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Gross Amount</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">GST on Order</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Commission</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Commission GST</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredGstSummary.lineItems.map((item: any) => (
                                                <tr key={item.orderId} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-4 text-sm font-bold text-slate-900">#{item.orderNumber || 'N/A'}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-slate-400">{new Date(item.orderDate || item.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-slate-600">{formatCurrency(item.grossAmount || item.orderAmount)}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-emerald-600">{formatCurrency(item.gstOnOrder || item.gstAmount)}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-slate-600">{formatCurrency(item.commission || item.commissionAmount)}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-red-400">-{formatCurrency(item.commissionGst)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TDS line items table */}
                        {filteredTdsSummary && filteredTdsSummary.lineItems && filteredTdsSummary.lineItems.length > 0 && (
                            <div className="rounded-[32px] bg-white shadow-sm border border-slate-50 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-50">
                                    <h3 className="text-lg font-bold text-slate-900">TDS Transactions Log (Sec 194-O)</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order #</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Gross Amount</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Commission</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">TDS Deducted</th>
                                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Receivable</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredTdsSummary.lineItems.map((item: any) => (
                                                <tr key={item.orderId} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-4 text-sm font-bold text-slate-900">#{item.orderNumber || 'N/A'}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-slate-400">{new Date(item.orderDate || item.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-slate-600">{formatCurrency(item.grossAmount || item.orderAmount)}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-slate-600">{formatCurrency(item.commission || item.commissionAmount)}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-orange-500">-{formatCurrency(item.tdsDeducted || item.tdsAmount)}</td>
                                                    <td className="px-8 py-4 text-sm font-bold text-emerald-600">{formatCurrency(item.netAfterTds || item.netAmount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}            </div>

            {/* Detail Modal */}
            <PayoutDetailsModal 
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                payout={selectedPayout}
            />
        </div>


    );
};

export default PayoutsPage;
