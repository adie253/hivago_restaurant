import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '../types';
import { formatCurrency, formatRelativeTime } from '../utils/format';
import { fetchOrderById } from '../api/dashboardApi';
import { useKotPrint, useLabelPrint } from '../hooks/usePrintDoc';
import { KitchenTicket } from './orders/KitchenTicket';
import { OrderLabel } from './orders/OrderLabel';
import pickup_icon from '../assets/pickup_icon.svg';
import TimelineModal from './TimelineModal';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const getStatusBadgeStyles = (status: Order['status']) => {
  switch (status) {
    case 'DELIVERED':
      return 'bg-green-50 text-green-600 border-green-100';
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-red-50 text-red-600 border-red-100';
    case 'REFUNDING':
      return 'bg-orange-50 text-orange-600 border-orange-100';
    case 'PICKED_UP':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const getStatusLabel = (status: Order['status']) => {
  switch (status) {
    case 'DELIVERED':
      return 'COMPLETED';
    case 'REJECTED':
      return 'REJECTED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'REFUNDING':
      return 'REFUNDING';
    default:
      return status;
  }
};

export default function OrderDetailsModal({ isOpen, onClose, order: initialOrder }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const kot = useKotPrint();
  const label = useLabelPrint();

  useEffect(() => {
    if (!isOpen || !initialOrder) {
      setOrder(null);
      return;
    }

    // Set initial order first (partial data)
    setOrder(initialOrder);

    // Fetch full order details
    const loadDetails = async () => {
      setLoading(true);
      try {
        const fullOrder = await fetchOrderById(initialOrder.id);
        setOrder(fullOrder);
      } catch (err) {
        console.error('Failed to load full order details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [isOpen, initialOrder]);

  if (!isOpen || !initialOrder) return null;

  const currentOrder = order || initialOrder;
  const isPaid = currentOrder.paymentStatus?.toUpperCase() === 'PAID';

  // Removed local timeline events generation as it is now a popup modal

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-4xl overflow-hidden rounded-[40px] bg-white shadow-[0_32px_120px_rgba(15,23,42,0.3)] flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 sm:px-10 shrink-0 bg-white">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Order #{currentOrder.orderNumber}
                  </h2>
                  <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${getStatusBadgeStyles(currentOrder.status)}`}>
                    {getStatusLabel(currentOrder.status)}
                  </span>
                  <button
                    onClick={() => setShowTimeline(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timeline
                  </button>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Placed {new Date(currentOrder.createdAt).toLocaleString()} ({formatRelativeTime(currentOrder.createdAt)})
                </p>
              </div>
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
          <div className="overflow-y-auto flex-1 p-8 sm:p-10 custom-scrollbar bg-slate-50/50">
            {loading && !order?.items?.length ? (
              // Loading skeleton
              <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="h-32 bg-slate-100 rounded-3xl" />
                    <div className="h-48 bg-slate-100 rounded-3xl" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-40 bg-slate-100 rounded-3xl" />
                    <div className="h-40 bg-slate-100 rounded-3xl" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Items and Billing */}
                <div className="md:col-span-2 space-y-6">
                  {/* Items Card */}
                  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                      Order Items
                    </h3>
                    <div className="divide-y divide-slate-100">
                      {currentOrder.items && currentOrder.items.length > 0 ? (
                        currentOrder.items.map((item) => (
                          <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-slate-900">{item.quantity} x</span>
                                  <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                                </div>
                                {item.specialInstructions && (
                                  <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                    <span className="text-amber-500 text-[10px]">★</span>
                                    <span>Instructions: <span className="font-medium text-slate-600">{item.specialInstructions}</span></span>
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-bold text-slate-900">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm font-semibold text-slate-400 italic py-4">No items details</p>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                      <div className="flex justify-between text-sm font-semibold text-slate-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(currentOrder.subTotal || currentOrder.total)}</span>
                      </div>
                      {(currentOrder.tax || 0) > 0 && (
                        <div className="flex justify-between text-sm font-semibold text-slate-500">
                          <span>Tax</span>
                          <span>{formatCurrency(currentOrder.tax || 0)}</span>
                        </div>
                      )}
                      {(currentOrder.discount || 0) > 0 && (
                        <div className="flex justify-between text-sm font-bold text-green-600">
                          <span>Discount</span>
                          <span>-{formatCurrency(currentOrder.discount || 0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-base font-bold text-slate-900 pt-4 border-t border-slate-100">
                        <span>Total Paid</span>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-bold">{formatCurrency(currentOrder.total)}</span>
                          <span className={`inline-flex items-center rounded-xl border px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase mt-1.5 ${
                            isPaid
                              ? 'bg-green-50 text-green-600 border-green-100'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                          }`}>
                            {isPaid ? 'PAID' : (currentOrder.paymentStatusDisplay?.toUpperCase() || currentOrder.paymentStatus?.toUpperCase() || 'UNPAID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {currentOrder.customerNote && (
                    <div className="rounded-3xl bg-[#FFF9E5] border border-[#FDE68A]/70 p-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#B45309] mb-2">
                        Customer Note
                      </h4>
                      <p className="text-sm font-medium text-slate-700">
                        {currentOrder.customerNote}
                      </p>
                    </div>
                  )}

                  {/* Cancellation / Rejection / Refund Reason warning card removed from here; details are shown inline inside the Timeline popup */}
                </div>

                {/* Right Column: Customer Info & Fulfillment */}
                <div className="space-y-6">
                  {/* Fulfillment Card */}
                  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                      Fulfillment Method
                    </h3>
                    <div className="flex items-center gap-3">
                      {currentOrder.pickupType === 'DELIVERY' ? (
                        <>
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <span className="font-bold text-sm">H</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">Hivago Delivery</p>
                            <p className="text-xs font-semibold text-slate-400">Delivery Partner Assigned</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <span className="font-bold text-sm">P</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">Customer Pickup</p>
                            <p className="text-xs font-semibold text-slate-400">Self Pickup</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Delivery address (if delivery) */}
                    {currentOrder.pickupType === 'DELIVERY' && currentOrder.address && (
                      <div className="mt-5 pt-5 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Delivery Address</p>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                          {currentOrder.address}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Customer Card */}
                  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                      Customer Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Name</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{currentOrder.customerName}</p>
                      </div>
                      {currentOrder.customerPhone && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-sm font-bold text-slate-800">{currentOrder.customerPhone}</p>
                            <span className="text-slate-300">·</span>
                            <a
                              href={`tel:${currentOrder.customerPhone}`}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Call Customer
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rider Card */}
                  {currentOrder.pickupType === 'DELIVERY' && !['DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes((currentOrder.status || '').toUpperCase()) && (currentOrder.riderName || currentOrder.otp) && (
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">

                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                        Rider & Codes
                      </h3>
                      <div className="space-y-4">
                        {currentOrder.riderName && (
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rider Name</p>
                            <p className="text-sm font-bold text-slate-800 mt-0.5">{currentOrder.riderName}</p>
                            {currentOrder.riderPhone && (
                              <a
                                href={`tel:${currentOrder.riderPhone}`}
                                className="mt-1 inline-block text-xs font-bold text-blue-600 hover:underline"
                              >
                                Call Rider ({currentOrder.riderPhone})
                              </a>
                            )}
                          </div>
                        )}
                        {currentOrder.otp && (
                          <div className="rounded-2xl bg-violet-50/50 border border-violet-100 p-3 text-center">
                            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Verification OTP</p>
                            <p className="text-2xl font-bold tracking-widest text-violet-700 mt-0.5">{currentOrder.otp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Help Links */}
                  <div className="flex gap-3">
                    <a
                      href={`https://wa.me/919082220155?text=Need%20help%20with%20Order%20%23${currentOrder.orderNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center rounded-2xl border border-slate-100 bg-white py-3.5 text-[10px] font-bold uppercase tracking-tight text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600"
                    >
                      Chat Support
                    </a>
                    <a
                      href={`https://wa.me/919082220155?text=Issue%20with%20Order%20%23${currentOrder.orderNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center rounded-2xl border border-slate-100 bg-white py-3.5 text-[10px] font-bold uppercase tracking-tight text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600"
                    >
                      Report Issue
                    </a>
                  </div>
                </div>
              </div>

              {/* Inline timeline removed; accessed via Timeline popup button */}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-8 py-5 sm:px-10 shrink-0 flex flex-wrap gap-3 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => kot.print(currentOrder.id)}
                className="flex items-center gap-2 rounded-2xl border-2 border-red-200 bg-white px-5 py-3 text-xs font-bold text-[#AD221F] shadow-sm hover:bg-red-50/50 transition-all hover:scale-105 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h8z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                PRINT KOT
              </button>
              <button
                onClick={() => label.print(currentOrder.id)}
                className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                PRINT BILL
              </button>
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-md shadow-slate-200"
            >
              Close
            </button>
          </div>

          {/* Hidden Print Targets */}
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            {kot.data && <KitchenTicket ref={kot.ref} ticket={kot.data} />}
            {label.data && <OrderLabel ref={label.ref} label={label.data} />}
          </div>

          <TimelineModal
            isOpen={showTimeline}
            onClose={() => setShowTimeline(false)}
            order={currentOrder}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
