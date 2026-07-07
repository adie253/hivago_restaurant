import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { formatCurrency, formatRelativeTime } from '../utils/format';
import { fetchDeliveryCodes, fetchOrderById, preparingOrder, readyOrder, rejectOrder } from '../api/dashboardApi';
import pickup_icon from '../assets/pickup_icon.svg';
import order_preparing_man from '../assets/order_preparing_man.svg';
import ready_to_pickup from '../assets/ready_to_pickup.svg';
import { useToast } from '../context/ToastContext';
import TimelineModal from './TimelineModal';
import { useAuth } from '../context/AuthContext';
import { useKotPrint, useLabelPrint } from '../hooks/usePrintDoc';
import { KitchenTicket } from './orders/KitchenTicket';
import { OrderLabel } from './orders/OrderLabel';

interface OrderCardProps {
  order: Order;
  onUpdate?: (updatedOrder: Order) => void;
}

const OrderCard = ({ order: initialOrder, onUpdate }: OrderCardProps) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const kot = useKotPrint();
  const label = useLabelPrint();
  
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedPrepTime, setSelectedPrepTime] = useState(25);
  const [deliveryPartner, setDeliveryPartner] = useState<'HIVAGO' | 'RESTAURANT'>('HIVAGO');
  const [deliveryCodes, setDeliveryCodes] = useState<{ pickupCode: string | null, dropCode: string | null } | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const fetchedIdsRef = React.useRef<Set<string>>(new Set());

  const calculateTimeLeft = () => {
    const createdAt = new Date(order.createdAt).getTime();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    const diff = Math.max(0, Math.floor((createdAt + tenMinutes - now) / 1000));
    return diff;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (order.status !== 'PENDING') return;

    // Initial sync
    const initialRemaining = calculateTimeLeft();
    setTimeLeft(initialRemaining);

    if (initialRemaining <= 0 && !actionLoading) {
      handleAutoReject();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      // Auto-reject if time is up and still pending
      if (remaining <= 0 && order.status === 'PENDING' && !actionLoading) {
        clearInterval(timer);
        handleAutoReject();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [order.status, order.createdAt, actionLoading]);

  const handleAutoReject = async () => {
    try {
      const updatedOrder = await rejectOrder(order.id, 'No response from restaurant');
      setOrder(updatedOrder);
      showToast(`Order #${order.orderNumber} auto-rejected due to inactivity`, 'info');
      if (onUpdate) onUpdate(updatedOrder);
    } catch (err) {
      console.error('Auto-rejection failed:', err);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Sync local state with prop when it changes (especially status)
    // We must merge carefully to avoid overwriting rich details fetched by loadFullDetails with minimal summary data
    setOrder(prev => ({
      ...prev,
      ...initialOrder,
      customerPhone: initialOrder.customerPhone || prev.customerPhone,
      address: initialOrder.address || prev.address,
      customerName: initialOrder.customerName || prev.customerName,
      customerNote: initialOrder.customerNote || prev.customerNote,
      paymentStatus: initialOrder.paymentStatus || prev.paymentStatus,
      paymentStatusDisplay: initialOrder.paymentStatusDisplay || prev.paymentStatusDisplay,
      riderName: initialOrder.riderName || prev.riderName,
      riderPhone: initialOrder.riderPhone || prev.riderPhone,
      otp: initialOrder.otp || prev.otp,
      items: (initialOrder.items && initialOrder.items.length > 0) ? initialOrder.items : prev.items
    }));

    const loadFullDetails = async () => {
      // If items are missing AND we haven't fetched them for this ID yet
      const needsFetch = (!initialOrder.items || initialOrder.items.length === 0) && !fetchedIdsRef.current.has(initialOrder.id);
      
      if (needsFetch) {
        // Add a small random delay to spread out requests when many cards mount at once
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
        
        // Check again after delay (in case it was fetched elsewhere or component unmounted)
        if (fetchedIdsRef.current.has(initialOrder.id)) return;

        setLoading(true);
        try {
          const fullOrder = await fetchOrderById(initialOrder.id);
          setOrder(fullOrder);
          fetchedIdsRef.current.add(initialOrder.id);
        } catch (err: any) {
          console.error(`Failed to fetch details for order ${initialOrder.id}`, err);
          showToast('Unable to load full order details', 'error');
        } finally {
          setLoading(false);
        }
      }
    };

    loadFullDetails();
  }, [
    initialOrder.id,
    initialOrder.status,
    initialOrder.paymentStatus,
    initialOrder.paymentStatusDisplay,
    initialOrder.riderName,
    initialOrder.riderPhone,
    initialOrder.otp,
    initialOrder.address,
    initialOrder.customerName,
    initialOrder.customerPhone,
    initialOrder.customerNote,
    JSON.stringify(initialOrder.items),
    showToast
  ]);

  useEffect(() => {
    const loadCodes = async () => {
      if (order.status === 'PREPARING' || order.status === 'READY') {
        try {
          const codes = await fetchDeliveryCodes(order.id);
          setDeliveryCodes(codes);
        } catch (err) {
          console.error('Failed to fetch delivery codes:', err);
        }
      } else {
        setDeliveryCodes(null);
      }
    };

    loadCodes();
  }, [order.id, order.status]);

  const handleReady = async () => {
    const originalOrder = { ...order };
    const optimisticOrder = { ...order, status: 'READY' as const };
    
    // Optimistic update
    setOrder(optimisticOrder);
    if (onUpdate) onUpdate(optimisticOrder);
    setActionLoading(true);

    try {
      const updatedOrder = await readyOrder(order.id);
      setOrder(updatedOrder);
      if (onUpdate) onUpdate(updatedOrder);
    } catch (err: any) {
      // Rollback
      setOrder(originalOrder);
      if (onUpdate) onUpdate(originalOrder);
      console.error('Failed to mark order as ready:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to update order status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    const originalOrder = { ...order };
    const optimisticOrder = { ...order, status: 'PREPARING' as const };

    // Optimistic update
    setOrder(optimisticOrder);
    if (onUpdate) onUpdate(optimisticOrder);
    setActionLoading(true);

    try {
      const updatedOrder = await preparingOrder(order.id, selectedPrepTime, deliveryPartner);
      setOrder(updatedOrder);
      if (onUpdate) onUpdate(updatedOrder);
    } catch (err: any) {
      // Rollback
      setOrder(originalOrder);
      if (onUpdate) onUpdate(originalOrder);
      console.error('Failed to accept order:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to accept order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectReason(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason) return;
    const originalOrder = { ...order };
    const optimisticOrder = { ...order, status: 'REJECTED' as const };

    // Optimistic update
    setOrder(optimisticOrder);
    if (onUpdate) onUpdate(optimisticOrder);
    setActionLoading(true);

    try {
      const updatedOrder = await rejectOrder(order.id, rejectReason);
      setOrder(updatedOrder);
      setShowRejectReason(false);
      setRejectReason('');
      if (onUpdate) onUpdate(updatedOrder);
    } catch (err: any) {
      // Rollback
      setOrder(originalOrder);
      if (onUpdate) onUpdate(originalOrder);
      console.error('Failed to reject order:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to reject order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="grid lg:grid-cols-[1.6fr_1fr]">
        
        {/* Left Column: Order Details */}
        <div className="p-8 lg:p-10">
          <header className="flex flex-wrap items-center gap-4 font-inter">
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-100"></div>
            ) : order.pickupType === 'DELIVERY' ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#AD221F] text-[12px] text-white">H</span>
                 Hivago Delivery
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[12px] text-white">P</span>
                 Self Pickup
              </div>
            )}

            {!loading && order.customerNote?.toLowerCase().includes('cutlery') && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                 </svg>
                 Cutlery
              </div>
            )}

            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-xl bg-slate-100"></div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                 <img src={pickup_icon} className="h-4 w-4" alt="" />
                 {order.pickupType === 'DELIVERY' ? 'Delivery' : 'Self Pickup'}
              </div>
            )}
          </header>

          <div className="mt-8">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">#{order.orderNumber}</h3>
            <p className="mt-1.5 text-sm font-semibold text-slate-400">
              {order.address} | {formatRelativeTime(order.createdAt)}
            </p>
          </div>

          {order.customerNote && (
            <div className="mt-6 rounded-2xl bg-[#FFF9E5] px-6 py-4 text-sm font-bold text-[#856404]">
              <span className="mr-1 text-[#D97706]">●</span> Customer Note: <span className="font-medium">{order.customerNote}</span>
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
             {order.status !== 'PENDING' ? (
               <>
                 <button 
                   onClick={() => kot.print(order.id)}
                   className="flex items-center gap-2 rounded-xl bg-[#AD221F] px-4 py-2 text-[11px] font-bold tracking-widest text-white shadow-md hover:bg-red-800 transition-all hover:scale-105 active:scale-95"
                 >
                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                     <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h8z" strokeLinecap="round" strokeLinejoin="round" />
                   </svg>
                   PRINT KOT
                 </button>
                 <button 
                   onClick={() => label.print(order.id)}
                   className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-[11px] font-bold tracking-widest text-white shadow-md hover:bg-slate-900 transition-all hover:scale-105 active:scale-95"
                 >
                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                     <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                   </svg>
                   PRINT BILL
                 </button>
               </>
             ) : (
               <span className="flex items-center gap-2 rounded-xl bg-[#EBEDFF] px-4 py-2 text-[11px] font-bold tracking-widest text-[#4C51BF]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  KOT
               </span>
             )}
             <span className="flex items-center gap-2 rounded-xl bg-[#EBEDFF] px-4 py-2 text-[11px] font-bold tracking-widest text-[#4C51BF]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ORDER
             </span>
             {loading ? (
                <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-100"></div>
              ) : order.paymentStatus?.toUpperCase() === 'PAID' ? (
                <span className="flex items-center gap-2 rounded-xl bg-[#DCFCE7] px-4 py-2 text-[11px] font-bold tracking-widest text-[#15803D]">
                  PAID
                </span>
              ) : (
                <span className="flex items-center gap-2 rounded-xl bg-[#FEF9C3] px-4 py-2 text-[11px] font-bold tracking-widest text-[#854D0E]">
                  {order.paymentStatusDisplay?.toUpperCase() || order.paymentStatus?.toUpperCase() || 'UNPAID'}
                </span>
              )}
             {order.status === 'READY' && (
                <span className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#FF8C66] bg-[#FFF3F0] text-[#FF8C66]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
             )}
          </div>

          <div className="mt-10 space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Order Items</p>
            {loading ? (
              <div className="flex animate-pulse flex-col gap-4">
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-50"></div>
                  <div className="flex-1 space-y-2 py-2">
                    <div className="h-4 w-1/2 rounded bg-slate-50"></div>
                    <div className="h-3 w-1/4 rounded bg-slate-50"></div>
                  </div>
                </div>
              </div>
            ) : order.items && order.items.length > 0 ? (
              order.items.map(item => (
                <div key={item.id} className="border-b border-slate-50 py-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 font-semibold flex-wrap">
                          <span className="text-sm font-inter text-slate-900">{item.quantity} x</span>
                          <span className="text-sm font-inter text-slate-700">{item.name}</span>
                          {item.specialInstructions && (
                            <span className="rounded-lg bg-[#FFF9E5] border border-[#FDE68A] px-2 py-0.5 text-xs font-semibold text-[#856404] flex items-center gap-1">
                              <span className="text-[#D97706] text-[10px]">★</span>
                              <span>Instructions: <span className="font-medium text-slate-700">{item.specialInstructions}</span></span>
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-bold text-slate-400 italic">No items available</p>
            )}
          </div>

          <div className="mt- border-t border-slate-100 pt-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {order.customerPhone} · <button className="font-semibold text-blue-600 hover:underline">Call</button>
                </p>

                <p className="mt-1.5 text-sm font-bold text-slate-500">{order.address}</p>
                <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-slate-300">Placed: {formatRelativeTime(order.createdAt)}</p>
                
                <button 
                  onClick={() => setShowTimeline(true)}
                  className="mt-8 text-sm font-bold text-blue-600 hover:underline"
                >
                  Timeline
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Action */}
        <div className="flex flex-col border-l border-slate-50 bg-[#FBFBFC] p-8 lg:p-10">
          <div className="flex-1">
             {order.status === 'PICKED_UP' ? (
                <div className="space-y-6">
                    <div className="flex overflow-hidden rounded-[32px] p-2 text-center ring-1 ring-blue-100">
                        <div className="h-22 rounded-[32px] bg-[#E0F2FE] p-4 flex items-center justify-center">
                             <div className="relative">
                                <img src={ready_to_pickup} className="h-16 w-auto object-contain" alt="Picked Up" />
                             </div>
                        </div>
                        <div className='text-start p-4'>
                           <h4 className="text-xl font-bold text-[#3B82F6]">Picked up</h4>
                           <p className="mt-1 text-sm font-bold text-[#3B82F6]/60">
                             {order.riderName?.split(' ')[0]} has picked up your order.
                           </p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4D4D] text-sm font-bold text-white shadow-lg">
                                {order.riderName?.split(' ').map(n => n[0]).join('') || 'RD'}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900">{order.riderName || 'Rider Assigned'}</p>
                                <p className="text-xs font-bold text-slate-400">has picked up your order</p>
                            </div>
                            <button className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth="2.5"/></svg>
                                Call
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-bold text-slate-600">Total Bill</p>
                           <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-500">
                              <span className="h-3.5 w-3.5 rounded-full border border-emerald-500 flex items-center justify-center text-[8px]">✓</span>
                              Paid
                           </span>
                        </div>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-3xl bg-[#E7FAF3] p-5 shadow-sm border border-[#D1F2E8]">
                            <div className="flex gap-3 items-start">
                                <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#1D915F]">Order was prepared in time</p>
                                    <p className="mt-0.5 text-xs font-bold text-[#1D915F]/70">Timely delivery to the customer</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5 space-y-4 text-center">
                            <p className="text-sm font-bold text-slate-600">Was {order.riderName} in uniform?</p>
                            <div className="flex gap-3">
                                <button className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-100 active:scale-95">
                                    No
                                </button>
                                <button className="flex-1 rounded-2xl bg-[#1D915F] py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95">
                                    Yes
                                </button>
                        </div>
                    </div>
                 </div>
              </div>
              ) : order.status === 'READY' ? (
                <div className="space-y-8">
                    <div className="flex overflow-hidden rounded-[32px] p-2 text-center ring-1 ring-violet-100">
                        <div className="h-22 rounded-[32px] bg-[#F5F3FF] p-4 flex items-center justify-center">
                             <div className="relative">
                                <img src={ready_to_pickup} className="h-20 w-auto object-contain" alt="Ready" />
                             </div>
                        </div>
                        <div className='text-start p-4'>
                           <h4 className="text-xl font-bold text-[#6366F1]">Ready to Pickup</h4>
                           <p className="mt-1 text-sm font-bold text-[#6366F1]/60">
                             {order.riderName ? `${order.riderName} is on the way.` : 'A rider will be assigned soon.'}
                           </p>
                        </div>
                    </div>


                    {order.pickupType === 'DELIVERY' ? (
                      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4D4D] text-sm font-bold text-white shadow-lg">
                                  {order.riderName?.split(' ').map(n => n[0]).join('') || 'RD'}
                              </div>
                              <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-900">{order.riderName || 'Rider assignment in progress'}</p>
                                  {order.riderName && <p className="text-xs font-bold text-emerald-500">is on the way</p>}
                              </div>
                          </div>
                          <div className="mt-5 flex flex-col gap-4">
                            {order.riderName && (
                              <button className="flex items-center gap-1.5 text-xs font-bold text-[#6366F1] hover:underline px-2 py-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2" />
                                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" />
                                </svg>
                                Track location
                              </button>
                            )}

                            {deliveryCodes?.pickupCode && (
                              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-center">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-violet-500 mb-1">Rider Verification Code</p>
                                <p className="text-3xl font-bold tracking-[0.2em] text-violet-700">
                                  {deliveryCodes.pickupCode}
                                </p>
                                <p className="mt-2 text-[9px] font-bold text-violet-600/60 leading-relaxed">
                                  Confirm this code with the rider before handing over.
                                </p>
                              </div>
                            )}
                          </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-slate-100 bg-emerald-50/30 p-5 text-center">
                          <p className="text-sm font-bold text-emerald-600">Waiting for customer to pickup</p>
                          <p className="mt-1 text-xs font-semibold text-emerald-600/60">Customer will arrive at the restaurant soon.</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-bold text-slate-600">Total Bill</p>
                           {loading ? (
                             <div className="h-4 w-12 animate-pulse rounded bg-slate-100"></div>
                           ) : order.paymentStatus?.toUpperCase() === 'PAID' ? (
                             <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-500">
                                <span className="h-3.5 w-3.5 rounded-full border border-emerald-500 flex items-center justify-center text-[8px]">✓</span>
                                Paid
                             </span>
                           ) : (
                             <span className="text-[10px] font-bold uppercase text-amber-600">{order.paymentStatusDisplay || 'Unpaid'}</span>
                           )}
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    </div>

                    <div className="rounded-3xl bg-[#E7FAF3] p-6 shadow-sm border border-[#D1F2E8]">
                        <div className="flex gap-3 items-start">
                             <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                             </div>
                             <div>
                                <p className="text-sm font-bold text-[#1D915F]">Order was prepared in time</p>
                                <p className="mt-0.5 text-xs font-bold text-[#1D915F]/70">Timely delivery to the customer</p>
                             </div>
                        </div>
                    </div>
                </div>
              ) : order.status === 'PENDING' ? (
                <div className="space-y-6">
                  {showRejectReason ? (
                    <div className="space-y-5 rounded-3xl border border-red-100 bg-red-50/30 p-6">
                      <div>
                        <h4 className="text-base font-bold text-red-600">Why are you rejecting this order?</h4>
                        <p className="mt-1 text-xs font-semibold text-red-400">This will be shared with the customer.</p>
                      </div>
                      <select
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="w-full rounded-xl border border-red-100 bg-white p-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
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
                          disabled={actionLoading}
                          className="flex-1 rounded-[16px] border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleConfirmReject}
                          disabled={!rejectReason || actionLoading}
                          className="flex-1 rounded-[16px] bg-red-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                        <div className="flex overflow-hidden rounded-[32px] p-2 text-center ring-1 ring-amber-100">
                            <div className="h-22 rounded-[32px] bg-amber-50 p-4 flex items-center justify-center">
                                 <div className="relative">
                                    <span className="text-4xl">⏳</span>
                                 </div>
                            </div>
                            <div className='text-start p-4'>
                               <div className="flex items-center justify-between gap-4">
                                 <h4 className="text-xl font-bold text-amber-600">Pending</h4>
                                 <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-sm font-bold tracking-tight ${
                                   timeLeft < 120 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-100 text-amber-700'
                                 }`}>
                                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                   </svg>
                                   {formatTimer(timeLeft)}
                                 </div>
                               </div>
                               <p className="mt-1 text-sm font-bold text-amber-600/60">Waiting for your acceptance</p>
                            </div>
                        </div>

                        {/* Prep Time Selection */}
                        <div>
                          <p className="text-sm font-bold text-slate-500 mb-3">Set preparation time:</p>
                          <div className="grid grid-cols-4 gap-2">
                            {[15, 20, 25, 30, 35, 40, 45, 60].map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedPrepTime(time)}
                                className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                                  selectedPrepTime === time
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100'
                                    : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {time}m
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Partner Selection */}
                        <div className="space-y-3">
                          <p className="text-sm font-bold text-slate-500">Delivery Partner:</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setDeliveryPartner('HIVAGO')}
                              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-3 transition-all ${
                                deliveryPartner === 'HIVAGO'
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-50 bg-white text-slate-400 hover:border-slate-100'
                              }`}
                            >
                              <span className="text-sm font-bold">Hivago</span>
                            </button>
                            <button
                              onClick={() => setDeliveryPartner('RESTAURANT')}
                              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-3 transition-all ${
                                deliveryPartner === 'RESTAURANT'
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-50 bg-white text-slate-400 hover:border-slate-100'
                              }`}
                            >
                              <span className="text-sm font-bold">Self Delivery</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                               <p className="text-sm font-bold text-slate-600">Total Bill</p>
                               {loading ? (
                                 <div className="h-4 w-12 animate-pulse rounded bg-slate-100"></div>
                               ) : order.paymentStatus?.toUpperCase() === 'PAID' ? (
                                 <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-500">
                                    <span className="h-3.5 w-3.5 rounded-full border border-emerald-500 flex items-center justify-center text-[8px]">✓</span>
                                    Paid
                                 </span>
                               ) : (
                                 <span className="text-[10px] font-bold uppercase text-amber-600">{order.paymentStatusDisplay || 'Unpaid'}</span>
                               )}
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{formatCurrency(order.total)}</p>
                        </div>

                        <div className="flex gap-3">
                            <button 
                              onClick={handleRejectClick}
                              disabled={actionLoading}
                              className={`flex-1 rounded-[20px] border-2 py-4 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex flex-col items-center justify-center ${
                                timeLeft < 120 
                                  ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' 
                                  : 'border-red-100 bg-white text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <span>Reject</span>
                              <span className="text-[10px] opacity-70">({formatTimer(timeLeft)})</span>
                            </button>
                            <button 
                              onClick={handleAccept}
                              disabled={actionLoading}
                              className="flex-[1.5] rounded-[20px] bg-emerald-500 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                              {actionLoading ? 'Accepting...' : 'Accept Order'}
                            </button>
                        </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">

                    <div className="flex overflow-hidden rounded-[32px]  p-2 text-center ring-1 ring-[#DEE5FF]">
                        <div className="h-22  rounded-[32px] bg-[#EEF2FF] p-4">
                           <img src={order_preparing_man} className="h-25 object-contain" alt="Preparing" />
                        </div>
                        <div className=' text-start p-4'>
                          <h4 className="text-xl font-bold text-[#4338CA]">Preparing</h4>
                        <p className="mt-1.5 text-sm font-bold text-[#4338CA]/60">The food is being prepared</p>
                        </div>
                    </div>


                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-bold text-slate-600">Total Bill</p>
                           {loading ? (
                             <div className="h-4 w-12 animate-pulse rounded bg-slate-100"></div>
                           ) : order.paymentStatus?.toUpperCase() === 'PAID' ? (
                             <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                <span className="h-4 w-4 rounded-full border border-emerald-500 flex items-center justify-center text-[8px]">✓</span>
                                Paid
                             </span>
                           ) : (
                             <span className="text-xs font-bold text-amber-600">{order.paymentStatusDisplay || 'Unpaid'}</span>
                           )}
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    </div>

                    {deliveryCodes?.pickupCode && (
                      <div className="rounded-3xl border border-violet-100 bg-violet-50/50 p-5 text-center mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1.5">Rider Verification Code</p>
                        <p className="text-3xl font-bold tracking-[0.2em] text-violet-700">
                          {deliveryCodes.pickupCode}
                        </p>
                        <p className="mt-2 text-[10px] font-bold text-violet-600/60 leading-relaxed">
                          Confirm this code with the rider <br /> before handing over the order.
                        </p>
                      </div>
                    )}

                    <button 
                      onClick={() => kot.print(order.id)}
                      className="w-full rounded-[20px] border-2 border-[#AD221F] bg-white py-4 text-sm font-bold text-[#AD221F] hover:bg-red-50/50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h8z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Print KOT (Kitchen Ticket)
                    </button>

                    <button 
                      onClick={() => label.print(order.id)}
                      className="w-full rounded-[20px] border-2 border-slate-800 bg-white py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Print Bill (Bag copy)
                    </button>

                    <button 
                      onClick={handleReady}
                      disabled={actionLoading}
                      className="w-full rounded-[20px] bg-[#AD221F] py-5 text-sm font-bold text-white shadow-xl shadow-red-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Updating...' : (
                        <>Order ready <span className="ml-1 opacity-60">(Est: 35 mins)</span></>
                      )}
                    </button>
                </div>
              )}
          </div>


          <div className="mt-8 flex gap-3">
             <a 
               href={`https://wa.me/919082220155?text=Need%20help%20with%20Order%20%23${order.orderNumber}`}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-1 text-center rounded-2xl border border-slate-100 bg-white py-4 text-[10px] font-bold uppercase tracking-tight text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600"
             >
                Live order chat support
             </a>
             <a 
               href={`https://wa.me/919082220155?text=Issue%20with%20Order%20%23${order.orderNumber}`}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-1 text-center rounded-2xl border border-slate-100 bg-white py-4 text-[10px] font-bold uppercase tracking-tight text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600"
             >
                Order help
             </a>
          </div>
        </div>
      </div>
      <TimelineModal 
        isOpen={showTimeline} 
        onClose={() => setShowTimeline(false)} 
        order={order} 
      />

      {/* Hidden print targets */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {kot.data && <KitchenTicket ref={kot.ref} ticket={kot.data} />}
        {label.data && <OrderLabel ref={label.ref} label={label.data} />}
      </div>
    </article>
  );
};

export default OrderCard;
