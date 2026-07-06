import { useEffect, useState } from 'react';
import { 
    RestaurantPayoutSummary, 
    RestaurantPayoutRow,
    PayoutStatus 
} from '../../types';
import { 
    fetchAdminPayoutSummary, 
    fetchAdminPayouts,
    triggerPayoutNow,
    holdPayout,
    releasePayoutHold,
    retryPayout
} from '../../api/payoutsApi';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/format';
import BankDetailsModal from '../../components/BankDetailsModal';
import { getAllOwners, updateOwnerBankDetailsAdmin } from '../../api/adminApi';


const AdminPayoutsPage = () => {
    const { showToast } = useToast();
    const [summary, setSummary] = useState<RestaurantPayoutSummary | null>(null);
    const [payouts, setPayouts] = useState<RestaurantPayoutRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
    const [selectedOwnerName, setSelectedOwnerName] = useState<string>('');
    const [bankModalOpen, setBankModalOpen] = useState(false);
    const [ownerBankDetails, setOwnerBankDetails] = useState<{
        bankAccountName?: string;
        bankAccountNumber?: string;
        bankIfscCode?: string;
    } | undefined>(undefined);

    const handleEditOwnerBank = async (ownerId: string, displayName: string) => {
        setSelectedOwnerId(ownerId);
        setSelectedOwnerName(displayName);
        try {
            const allOwners = await getAllOwners();
            const owner = allOwners.find(o => o.id === ownerId);
            if (owner) {
                setOwnerBankDetails({
                    bankAccountName: owner.bankAccountName,
                    bankAccountNumber: owner.bankAccountNumber,
                    bankIfscCode: owner.bankIfscCode
                });
            } else {
                setOwnerBankDetails(undefined);
            }
            setBankModalOpen(true);
        } catch (err) {
            showToast('Failed to fetch owner details', 'error');
        }
    };

    const handleSaveOwnerBankAdmin = async (data: {
        bankAccountName: string;
        bankAccountNumber: string;
        bankIfscCode: string;
    }) => {
        if (!selectedOwnerId) return;
        await updateOwnerBankDetailsAdmin(selectedOwnerId, data);
        showToast('Bank details updated successfully', 'success');
    };


    const loadData = async () => {
        setLoading(true);
        try {
            const [summaryData, pagedData] = await Promise.all([
                fetchAdminPayoutSummary(),
                fetchAdminPayouts({ 
                    status: statusFilter === 'All' ? undefined : statusFilter, 
                    page, 
                    pageSize 
                })
            ]);
            setSummary(summaryData);
            setPayouts(pagedData.items);
        } catch (err) {
            console.error('Failed to load admin payouts', err);
            showToast('Failed to load payout data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [statusFilter, page]);

    const handleAction = async (payoutId: string, action: 'pay-now' | 'hold' | 'release' | 'retry') => {
        setActionLoading(payoutId);
        try {
            switch (action) {
                case 'pay-now':
                    const result = await triggerPayoutNow(payoutId);
                    showToast(`Payout successful! Ref: ${result.transactionReference}`, 'success');
                    break;
                case 'hold':
                    await holdPayout(payoutId, 'Admin manual hold');
                    showToast('Payout placed on hold', 'info');
                    break;
                case 'release':
                    await releasePayoutHold(payoutId);
                    showToast('Hold released', 'success');
                    break;
                case 'retry':
                    await retryPayout(payoutId);
                    showToast('Payout re-queued for retry', 'info');
                    break;
            }
            loadData(); // Refresh list and summary
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Action failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: PayoutStatus) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Failed': return 'bg-red-50 text-red-600 border-red-100';
            case 'OnHold': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'Processing': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-400';
        }
    };

    if (loading && !summary) return <div className="p-10 text-center font-bold text-slate-400">Loading Dashboard...</div>;

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Payout Control Center</h1>
                    <p className="mt-1 text-sm font-bold text-slate-400">Manage platform-wide restaurant settlements</p>
                </div>
                <button 
                    onClick={loadData}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm border border-slate-100 hover:text-slate-900 transition-all"
                >
                    <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="group rounded-[32px] bg-white p-6 shadow-sm border border-slate-50 transition-all hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-amber-500 transition-colors">Pending</p>
                        <p className="text-2xl font-bold text-amber-500">{formatCurrency(summary.totalPendingAmount)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-300">{summary.pendingCount} restaurants</p>
                    </div>
                    <div className="group rounded-[32px] bg-white p-6 shadow-sm border border-slate-50 transition-all hover:shadow-xl hover:shadow-red-50 hover:-translate-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-red-500 transition-colors">Failed</p>
                        <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.failedAmount)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-300">Requires investigation</p>
                    </div>
                    <div className="group rounded-[32px] bg-white p-6 shadow-sm border border-slate-50 transition-all hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-slate-600 transition-colors">On Hold</p>
                        <p className="text-2xl font-bold text-slate-400">{formatCurrency(summary.onHoldAmount)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-300">{summary.onHoldCount} paused payouts</p>
                    </div>
                    <div className="group rounded-[32px] bg-slate-900 p-6 shadow-xl shadow-slate-200 transition-all hover:shadow-2xl hover:shadow-slate-300 hover:-translate-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 group-hover:text-white/60 transition-colors">Platform Profit</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(summary.platformProfit)}</p>
                        <p className="mt-1 text-xs font-bold text-white/20">Net commission</p>
                    </div>
                    <div className="group rounded-[32px] bg-[#AD221F] p-6 shadow-xl shadow-red-100 transition-all hover:shadow-2xl hover:shadow-red-200 hover:-translate-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 group-hover:text-white/70 transition-colors">Next Auto-Run</p>
                        <p className="text-xl font-bold text-white">Mon, 6 AM</p>
                        <p className="mt-1 text-xs font-bold text-white/30">In 3 days</p>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 w-fit">
                {['All', 'Pending', 'OnHold', 'Failed', 'Paid'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`rounded-xl px-6 py-2 text-xs font-bold tracking-widest uppercase transition-all ${
                            statusFilter === status 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {status === 'OnHold' ? 'On Hold' : status}
                    </button>
                ))}
            </div>

            {/* Main List */}
            <div className="rounded-[40px] bg-white shadow-sm border border-slate-50 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Restaurant / Owner</th>
                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Cycle</th>
                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Payable</th>
                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {payouts.map((row) => (
                            <tr key={row.payoutId} className="group hover:bg-slate-50/50 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{row.displayName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{row.orderCount} orders</p>
                                        </div>
                                        <button 
                                            onClick={() => handleEditOwnerBank(row.ownerId, row.displayName)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all ml-1"
                                            title="Edit Owner Bank Details"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>

                                <td className="px-8 py-6">
                                    <p className="text-xs font-bold text-slate-600">{row.cycleStart} - {row.cycleEnd}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-lg font-bold text-slate-900">{formatCurrency(row.netPayable)}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold tracking-widest uppercase border ${getStatusColor(row.status)}`}>
                                            <div className={`h-1.5 w-1.5 rounded-full ${row.status === 'Processing' ? 'animate-ping' : ''} bg-current`} />
                                            {row.status}
                                        </span>
                                        {row.statusNote && (
                                            <p className="text-[9px] font-bold text-red-400 italic max-w-[150px] truncate" title={row.statusNote}>
                                                {row.statusNote}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {row.status === 'Pending' && (
                                            <>
                                                <button 
                                                    disabled={!!actionLoading}
                                                    onClick={() => handleAction(row.payoutId, 'hold')}
                                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    Hold
                                                </button>
                                                <button 
                                                    disabled={!!actionLoading}
                                                    onClick={() => handleAction(row.payoutId, 'pay-now')}
                                                    className="rounded-xl bg-emerald-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {actionLoading === row.payoutId ? 'Processing...' : 'Pay Now'}
                                                </button>
                                            </>
                                        )}
                                        {row.status === 'OnHold' && (
                                            <>
                                                <button 
                                                    disabled={!!actionLoading}
                                                    onClick={() => handleAction(row.payoutId, 'release')}
                                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    Release
                                                </button>
                                                <button 
                                                    disabled={!!actionLoading}
                                                    onClick={() => handleAction(row.payoutId, 'pay-now')}
                                                    className="rounded-xl bg-emerald-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    Pay Now
                                                </button>
                                            </>
                                        )}
                                        {row.status === 'Failed' && (
                                            <button 
                                                disabled={!!actionLoading}
                                                onClick={() => handleAction(row.payoutId, 'retry')}
                                                className="rounded-xl bg-red-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-red-100 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Retry
                                            </button>
                                        )}
                                        {row.status === 'Paid' && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Paid On</p>
                                                <p className="text-xs font-bold text-slate-900">{row.paidAtUtc ? new Date(row.paidAtUtc).toLocaleDateString() : '-'}</p>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <BankDetailsModal
                isOpen={bankModalOpen}
                onClose={() => setBankModalOpen(false)}
                initialData={ownerBankDetails}
                onSave={handleSaveOwnerBankAdmin}
                title={`Bank Details: ${selectedOwnerName}`}
            />
        </div>
    );
};

export default AdminPayoutsPage;

