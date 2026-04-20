import { useEffect, useState } from 'react';
import { Order } from '../types';
import { formatCurrency, formatRelativeTime } from '../utils/format';
import { fetchOrderById, readyOrder } from '../api/dashboardApi';
import pickup_icon from '../assets/pickup_icon.svg';
import order_preparing_man from '../assets/order_preparing_man.svg';
import ready_to_pickup from '../assets/ready_to_pickup.svg';

interface OrderCardProps {
  order: Order;
  onUpdate?: () => void;
}

const OrderCard = ({ order: initialOrder, onUpdate }: OrderCardProps) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadFullDetails = async () => {
      // If items are missing, fetch the full order details
      if (!order.items || order.items.length === 0) {
        setLoading(true);
        try {
          const fullOrder = await fetchOrderById(initialOrder.id);
          setOrder(fullOrder);
        } catch (err) {
          console.error(`Failed to fetch details for order ${initialOrder.id}`, err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadFullDetails();
  }, [initialOrder.id]);

  const handleReady = async () => {
    setActionLoading(true);
    try {
      await readyOrder(order.id);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to mark order as ready:', err);
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
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
               <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#AD221F] text-[12px] text-white">H</span>
               Hivago Delivery
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
               Cutlery
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
               <img src={pickup_icon} className="h-4 w-4" alt="" />
               Delivery
            </div>
          </header>

          <div className="mt-8">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">#{order.orderNumber}</h3>
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
             <span className="flex items-center gap-2 rounded-xl bg-[#EBEDFF] px-4 py-2 text-[11px] font-black tracking-widest text-[#4C51BF]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                KOT
             </span>
             <span className="flex items-center gap-2 rounded-xl bg-[#EBEDFF] px-4 py-2 text-[11px] font-black tracking-widest text-[#4C51BF]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ORDER
             </span>
             <span className="flex items-center gap-2 rounded-xl bg-[#DCFCE7] px-4 py-2 text-[11px] font-black tracking-widest text-[#15803D]">
                PAID
             </span>
             {order.status === 'READY' && (
                <span className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#FF8C66] bg-[#FFF3F0] text-[#FF8C66]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
             )}
          </div>

          <div className="mt-10 space-y-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-300">Order Items</p>
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
                <div key={item.id} className="flex items-center justify-between border-b border-slate-50 line-height-[2px] last:border-0 last:pb-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 font-semibold">
                        <span className="text-sm font-inter text-slate-900">{item.quantity} x</span>
                        <span className="text-sm font-inter text-slate-700">{item.name}</span>
                    </div>
                    {/* {item.description && (
                        <p className="mt-0.5 text-sm font-semibold text-slate-400">{item.description}</p>
                    )} */}
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
                <p className="text-lg font-black text-slate-900">
                  {order.customerPhone} · <button className="font-semibold text-blue-600 hover:underline">Call</button>
                </p>
                <p className="mt-1 text-sm font-bold text-slate-400 italic">1st order</p>
                <p className="mt-1.5 text-sm font-bold text-slate-500">{order.address} (&lt;1 km, 1 mins away)</p>
                <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-slate-300">Placed: {formatRelativeTime(order.createdAt)}</p>
                
                <button className="mt-8 text-sm font-bold text-blue-600 hover:underline">Timeline</button>
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
                           <h4 className="text-xl font-black text-[#3B82F6]">Picked up</h4>
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
                                <p className="text-sm font-black text-slate-900">{order.riderName || 'Rider Assigned'}</p>
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
                           <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500">
                              <span className="h-3.5 w-3.5 rounded-full border border-emerald-500 flex items-center justify-center text-[8px]">✓</span>
                              Paid
                           </span>
                        </div>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(order.total)}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-3xl bg-[#E7FAF3] p-5 shadow-sm border border-[#D1F2E8]">
                            <div className="flex gap-3 items-start">
                                <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-[#1D915F]">Order was prepared in time</p>
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
                             {/* Ready Illustration - Waiter Placeholder */}
                             <div className="relative">
                                <img src={ready_to_pickup} className="h-20 w-auto object-contain" alt="Ready" />
                             </div>
                        </div>
                        <div className='text-start p-4'>
                           <h4 className="text-xl font-black text-[#6366F1]">Ready to Pickup</h4>
                           <p className="mt-1 text-sm font-bold text-[#6366F1]/60">Nawaal is on the way.</p>
                        </div>
                    </div>


                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4D4D] text-sm font-bold text-white shadow-lg">
                                {order.riderName?.split(' ').map(n => n[0]).join('') || 'RD'}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-slate-900">{order.riderName || 'Rider Assigned'}</p>
                                <p className="text-xs font-bold text-emerald-500">is on the way</p>
                            </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between">
                            <div className="flex gap-2">
                                <button className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-tight text-[#AD221F] hover:bg-slate-100">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth="2.5"/></svg>
                                    Call
                                </button>
                                <button className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-tight text-slate-600">
                                    OTP: {order.otp || '5997'}
                                </button>
                            </div>
                            <button className="flex items-center gap-1.5 text-xs font-bold text-[#6366F1] hover:underline px-2 py-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/></svg>
                                Track location
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-bold text-slate-600">Total Bill</p>
                           <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500">
                              <span className="h-3.5 w-3.5 rounded-full border border-emerald-500 flex items-center justify-center text-[8px]">✓</span>
                              Paid
                           </span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(order.total)}</p>
                    </div>

                    <div className="rounded-3xl bg-[#E7FAF3] p-6 shadow-sm border border-[#D1F2E8]">
                        <div className="flex gap-3 items-start">
                             <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                             </div>
                             <div>
                                <p className="text-sm font-black text-[#1D915F]">Order was prepared in time</p>
                                <p className="mt-0.5 text-xs font-bold text-[#1D915F]/70">Timely delivery to the customer</p>
                             </div>
                        </div>
                    </div>
                </div>
             ) : (
                <div className="space-y-5">
                    <div className="flex overflow-hidden rounded-[32px]  p-2 text-center ring-1 ring-[#DEE5FF]">
                        <div className="h-22  rounded-[32px] bg-[#EEF2FF] p-4">
                           <img src={order_preparing_man} className="h-25 object-contain" alt="Preparing" />
                        </div>
                        <div className=' text-start p-4'>
                          <h4 className="text-xl font-black text-[#4338CA]">Preparing</h4>
                        <p className="mt-1.5 text-sm font-bold text-[#4338CA]/60">The food is being prepared</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm text-center">
                        <p className="text-xs font-bold text-slate-500">5 riders nearby, assigning one soon</p>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-bold text-slate-600">Total Bill</p>
                           <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                              <span className="h-4 w-4 rounded-full border border-emerald-500 flex items-center justify-center text-[8px]">✓</span>
                              Paid
                           </span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(order.total)}</p>
                    </div>

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

          <div className="mt-8 flex">
             <button className="flex-1 rounded-2xl border border-slate-100 bg-white py-4 text-[10px] font-black uppercase tracking-tight text-slate-500 transition-colors hover:bg-slate-50">
                Live order chat support
             </button>
             <button className="flex-1 rounded-2xl border border-slate-100 bg-white py-4 text-[10px] font-black uppercase tracking-tight text-slate-500 transition-colors hover:bg-slate-50">
                Order help
             </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default OrderCard;



