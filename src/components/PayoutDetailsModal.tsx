import { PayoutDetailDto, PayoutLedgerDto } from '../types';
import { formatCurrency } from '../utils/format';

interface PayoutDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout: PayoutDetailDto | null;
}

const PayoutDetailsModal = ({ isOpen, onClose, payout }: PayoutDetailsModalProps) => {
  if (!isOpen || !payout) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl overflow-hidden rounded-[40px] bg-white shadow-[0_32px_120px_rgba(15,23,42,0.3)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-50 px-10 py-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settlement Details</h2>
            <p className="mt-1 text-sm font-bold text-slate-400">
              Cycle: {payout.periodStart} to {payout.periodEnd}
            </p>
          </div>
          <button
            onClick={onClose}
            className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
          >
            <svg className="h-6 w-6 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-10 pb-6">
            <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">{payout.orderCount}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Gross Sales</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(payout.grossOrderAmount)}</p>
            </div>
            <div className="rounded-3xl bg-red-50 p-6 border border-red-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">Commission & Taxes</p>
              <p className="text-2xl font-bold text-red-600">
                -{formatCurrency(payout.totalCommission + payout.totalCommissionGst + payout.totalTds)}
              </p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-6 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Net Payout</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(payout.netPayoutAmount)}</p>
            </div>
          </div>

          {/* Table */}
          <div className="px-10 pb-10">
            <div className="overflow-x-auto rounded-3xl border border-slate-50 bg-white shadow-sm">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Order</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Date</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap text-right">Gross</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap text-right">GST</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap text-right">Comm.</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap text-right">TDS</th>
                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap text-right">Net Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payout.ledgerEntries.map((entry: PayoutLedgerDto) => {
                    const displayNum = entry.orderNumber || (entry as any).orderNo || (entry as any).order_number || (entry as any).orderCode || (entry as any).orderId || entry.orderId || 'N/A';
                    const formattedNum = String(displayNum).startsWith('#') ? displayNum : `#${displayNum}`;
                    const tdsValue = entry.tdsAmount ?? (entry as any).tds ?? (entry as any).totalTds ?? 0;
                    return (
                    <tr key={entry.orderId} className="hover:bg-slate-50/50 transition-all font-semibold">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-slate-900">{formattedNum}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-400">{new Date(entry.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap text-right">{formatCurrency(entry.orderAmount)}</td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap text-right">{formatCurrency(entry.gstAmount)}</td>
                      <td className="px-5 py-4 text-red-500 whitespace-nowrap text-right">-{formatCurrency(entry.commissionAmount + entry.commissionGst)}</td>
                      <td className="px-5 py-4 text-red-500 whitespace-nowrap text-right">{tdsValue > 0 ? `-${formatCurrency(tdsValue)}` : formatCurrency(tdsValue)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(entry.netAmount)}</td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-50 bg-slate-50/30 px-10 py-6 shrink-0 flex justify-between items-center">
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${
                        payout.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                        {payout.status}
                    </span>
                    {payout.transactionReference && (
                        <p className="text-xs font-bold text-slate-400">
                            UTR: <span className="text-slate-900 uppercase">{payout.transactionReference}</span>
                        </p>
                    )}
                </div>
                {payout.notes && (
                    <p className="text-xs font-bold text-slate-400">
                        Notes: <span className="text-slate-600 font-semibold">{payout.notes}</span>
                    </p>
                )}
            </div>
            <button
                onClick={onClose}
                className="rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default PayoutDetailsModal;
