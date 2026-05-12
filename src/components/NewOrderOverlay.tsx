import { useEffect, useState } from 'react';
import { Order } from '../types';
import { formatCurrency, formatRelativeTime } from '../utils/format';
import { fetchOrderById } from '../api/dashboardApi';
import hivago_delivery_popup from '../assets/hivago_delivery_popup.svg';
import restaurant_delivery_popup from '../assets/restaurant_delivery_popup.svg';

interface NewOrderOverlayProps {
  order: Order;
  onAccept: (prepTime: number) => void;
  onReject: (reason: string) => void;
  onClose: () => void;
}

const NewOrderOverlay = ({ order: initialOrder, onAccept, onReject, onClose }: NewOrderOverlayProps) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [loading, setLoading] = useState(false);
  const calculateTimeLeft = () => {
    const createdAt = new Date(order.createdAt).getTime();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    const diff = Math.max(0, Math.floor((createdAt + tenMinutes - now) / 1000));
    return diff;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [selectedPrepTime, setSelectedPrepTime] = useState(25);
  const [deliveryPartner, setDeliveryPartner] = useState<'HIVAGO' | 'RESTAURANT'>('HIVAGO');

  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const loadFullDetails = async () => {
      // If items are missing or it's a minimal order object, fetch full details
      if (!initialOrder.items || initialOrder.items.length === 0 || !initialOrder.address) {
        setLoading(true);
        try {
          const fullOrder = await fetchOrderById(initialOrder.id);
          setOrder(fullOrder);
        } catch (err) {
          console.error(`Failed to fetch details for new order ${initialOrder.id}`, err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadFullDetails();
  }, [initialOrder.id]);

  useEffect(() => {
    // Initial sync
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onReject('No response from restaurant (Timed out)');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  const prepTimes = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full h-auto max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-[0_32px_120px_rgba(15,23,42,0.3)] flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5 pb-0 shrink-0">
          <h2 className="text-xl font-black tracking-tight text-slate-900">1 new order</h2>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            <button onClick={onClose} className="rounded-full bg-slate-50 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="grid lg:grid-cols-[1.2fr_1fr]">
            {/* Left Column: Order Intelligence */}
            <div className="border-r border-slate-100 p-8">
              <div className="flex gap-2.5">
                {loading ? (
                  <div className="h-6 w-24 animate-pulse rounded bg-violet-50"></div>
                ) : (
                  <span className="rounded-lg bg-violet-100 px-3 py-1.5 text-[10px] font-semibold tracking-widest text-violet-700 uppercase">
                    {order.pickupType === 'DELIVERY' ? 'Hivago Delivery' : 'Self Pickup'}
                  </span>
                )}
                {!loading && order.customerNote?.toLowerCase().includes('cutlery') && (
                  <span className="rounded-lg bg-orange-100 px-3 py-1.5 text-[10px] font-semibold tracking-widest text-orange-700 uppercase">
                    🍴 Cutlery Required
                  </span>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-black tracking-tight text-slate-900">#{order.orderNumber}</h3>
                <p className="mt-1 text-sm font-normal text-slate-400">
                  {order.address || 'Bandra East'} | {formatRelativeTime(order.createdAt)}
                </p>
              </div>

              {order.customerNote && (
                <div className="mt-6 rounded-2xl bg-[#FFFBEB] border-l-4 border-amber-400 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Customer Note:</p>
                  <p className="mt-1.5 text-base font-bold text-amber-900 leading-relaxed italic">
                    "{order.customerNote || 'No note'}"
                  </p>
                </div>
              )}

              <div className="mt-8 space-y-4">
                {order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <span className="mt-0.5 text-base">🌶️</span>
                        <div>
                          <p className="text-md  font-semibold text-slate-900 leading-tight">
                            {item.quantity} x {item.name}
                          </p>
                          {/* <p className="mt-0.5 text-xs font-semibold text-slate-400">{item.description || 'Extra spicy, no onions'}</p> */}
                        </div>
                      </div>
                      <p className="text-md font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-bold text-slate-400 italic">No items details</p>
                )}
              </div>

              <div className="mt-10 space-y-3 border-t border-slate-100 pt-6">
                <div className="flex justify-between text-sm font-semibold text-slate-400 leading-none">
                  <span>{order.items.length} items</span>
                  <span>{formatCurrency(order.subTotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-slate-400 leading-none">
                  <span>Taxes</span>
                  <span>{formatCurrency(order.tax ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-emerald-500 leading-none">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xl font-semibold text-slate-900">Total Bill</span>
                  <div className="flex items-center gap-3">
                    {loading ? (
                      <div className="h-4 w-12 animate-pulse rounded bg-emerald-50"></div>
                    ) : order.paymentStatus?.toUpperCase() === 'PAID' ? (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 uppercase">PAID</span>
                    ) : (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600 uppercase">{order.paymentStatusDisplay || 'UNPAID'}</span>
                    )}
                    <span className="text-2xl font-semibold text-slate-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Dispatch Actions */}
            <div className="bg-slate-50/50 p-4 space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-4">Set food preparation time:</h4>
                <div className="mt- grid grid-cols-4 gap-1">
                  {prepTimes.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedPrepTime(time)}
                      className={`rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                        selectedPrepTime === time
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 ring-2 ring-emerald-100'
                          : 'bg-white text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-md'
                      }`}
                    >
                      {time} mins
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">Select delivery partner:</h4>
                <div className="mt-4 space-y-3">
                  <button
                    onClick={() => setDeliveryPartner('HIVAGO')}
                    className={`flex h-12 w-full items-center gap-3 rounded-2xl border-2 px-4 transition-all duration-200 ${
                      deliveryPartner === 'HIVAGO'
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-white bg-white hover:border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      deliveryPartner === 'HIVAGO' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200'
                    }`}>
                      {deliveryPartner === 'HIVAGO' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <img src={hivago_delivery_popup} alt="" />
                    <span className="text-base font-bold text-slate-600">Hivago Delivery</span>
                  </button>

                  <button
                    onClick={() => setDeliveryPartner('RESTAURANT')}
                    className={`flex h-12 w-full items-center gap-3 rounded-2xl border-2 px-4 transition-all duration-200 ${
                      deliveryPartner === 'RESTAURANT'
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-white bg-white hover:border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      deliveryPartner === 'RESTAURANT' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200'
                    }`}>
                      {deliveryPartner === 'RESTAURANT' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <img src={restaurant_delivery_popup} alt="" />
                    <span className="text-base font-bold text-slate-600">Restaurant Delivery</span>
                  </button>
                </div>
              </div>

              <div className="mt-8">
                {showRejectReason ? (
                  <div className="space-y-4 rounded-3xl border border-red-100 bg-red-50/50 p-5">
                    <div>
                      <h4 className="text-sm font-bold text-red-600">Why are you rejecting this order?</h4>
                    </div>
                    <select
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      className="w-full rounded-2xl border border-red-100 bg-white p-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="">Select a reason...</option>
                      <option value="Items out of stock">Items out of stock</option>
                      <option value="Kitchen is too busy">Kitchen is too busy</option>
                      <option value="Closing soon">Closing soon</option>
                      <option value="Delivery area too far">Delivery area too far</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          setShowRejectReason(false);
                          setRejectReason('');
                        }}
                        className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => onReject(rejectReason)}
                        disabled={!rejectReason}
                        className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white shadow-md shadow-red-200 hover:bg-red-600 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRejectReason(true)}
                      className={`flex-1 py-2 rounded-2xl border-2 text-md font-bold transition-all active:scale-[0.98] flex flex-col items-center justify-center ${
                        timeLeft < 120 
                          ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' 
                          : 'border-red-100 bg-white text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <span>Reject</span>
                      <span className="text-[10px] opacity-70">({formatTimer(timeLeft)})</span>
                    </button>
                    <button
                      onClick={() => onAccept(selectedPrepTime)}
                      className="flex-[1.5] rounded-2xl bg-emerald-500 text-md font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-[0.98] py-3"
                    >
                      Accept order
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default NewOrderOverlay;
