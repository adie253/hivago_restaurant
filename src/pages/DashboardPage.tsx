import { useEffect, useMemo, useState } from 'react';
import { confirmOrder, preparingOrder, rejectOrder } from '../api/dashboardApi';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useOrders } from '../hooks/useOrders';
import OrderCard from '../components/OrderCard';
import NewOrderOverlay from '../components/NewOrderOverlay';
import HistoryTable from '../components/HistoryTable';
import StatCard from '../components/StatCard';
import { StatCardSkeleton, OrderCardSkeleton } from '../components/Skeletons';
import Toast from '../components/Toast';
import { Order, OrderSectionKey } from '../types';

import todays_orders_icon from '../assets/todays_orders_icon.svg';
import todays_revenue_icon from '../assets/todays_revenue_icon.svg';
import prep_time_icon from '../assets/prep_time_icon.svg';
import rejection_rate_icon from '../assets/rejection_rate_icon.svg';

import preparing_icon from '../assets/preparing_icon.svg';
import ready_ordres_icon from '../assets/ready_ordres_icon.svg';
import pickup_icon from '../assets/pickup_icon.svg';
import order_history_icon from '../assets/order_history_icon.svg';

const orderSections = [
  { key: 'PENDING', label: 'Pending', icon: preparing_icon, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'PREPARING', label: 'Preparing', icon: preparing_icon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'READY', label: 'Ready', icon: ready_ordres_icon, color: 'text-slate-500', bg: 'bg-slate-50' },
  { key: 'HISTORY', label: 'Order History', icon: order_history_icon, color: 'text-slate-500', bg: 'bg-slate-50' }
] as const;

const DashboardPage = () => {
  const [activeSection, setActiveSection] = useState<OrderSectionKey>('PENDING');
  const [newOrderModal, setNewOrderModal] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const { stats, loading: loadingStats, error: statsError } = useDashboardStats();
  const { orders, newOrder, setNewOrder, refreshOrders, updateLocalOrder, loading: loadingOrders, error: ordersError } = useOrders();

  const handleOrderUpdate = (updatedOrder: Order) => {
    updateLocalOrder(updatedOrder);
    
    let type: 'success' | 'info' = 'success';
    let msg = `Order #${updatedOrder.orderNumber} is now ${updatedOrder.status.toLowerCase()}`;
    
    if (updatedOrder.status === 'REJECTED' || updatedOrder.status === 'CANCELLED') {
      type = 'info';
      msg = `Order #${updatedOrder.orderNumber} has been ${updatedOrder.status.toLowerCase()}`;
    } else if (updatedOrder.status === 'REFUNDING') {
      type = 'success';
      msg = `Refund initiated for Order #${updatedOrder.orderNumber}`;
    }
    
    setToast({ message: msg, type });
  };

  useEffect(() => {
    if (newOrder) {
      setNewOrderModal(newOrder);
    }
  }, [newOrder]);

  const handleConfirm = async () => {
    if (!newOrderModal) return;
    setActionLoading(true);
    try {
      const updatedOrder = await preparingOrder(newOrderModal.id);
      handleOrderUpdate(updatedOrder);
      setNewOrderModal(null);
      setNewOrder(null);
    } catch (err: any) {
      console.error('Failed to mark order as preparing:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!newOrderModal) return;
    setActionLoading(true);
    try {
      const updatedOrder = await rejectOrder(newOrderModal.id, reason);
      handleOrderUpdate(updatedOrder);
      setNewOrderModal(null);
      setNewOrder(null);
    } catch (err: any) {
      console.error('Failed to reject order:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  const sectionCounts = useMemo(() => {
    const counts = {
      PENDING: 0,
      PREPARING: 0,
      READY: 0,
      HISTORY: 0
    } as Record<OrderSectionKey, number>;

    orders.forEach(order => {
      if (order.status === 'PENDING') counts.PENDING += 1;
      if (order.status === 'PREPARING') counts.PREPARING += 1;
      if (order.status === 'READY') counts.READY += 1;
      if (order.status === 'PICKED_UP' || order.status === 'DELIVERED' || order.status === 'REJECTED' || order.status === 'CANCELLED' || order.status === 'REFUNDING') counts.HISTORY += 1;
    });

    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeSection === 'HISTORY') {
        return order.status === 'PICKED_UP' || order.status === 'DELIVERED' || order.status === 'REJECTED' || order.status === 'CANCELLED' || order.status === 'REFUNDING';
      }
      return order.status === activeSection;
    });
  }, [activeSection, orders]);

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loadingStats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard label="Today's Orders" value={stats.liveOrders.toString()} icon={todays_orders_icon} />
            <StatCard label="Today's Revenue" value={`₹${stats.todayRevenue.toLocaleString()}`} icon={todays_revenue_icon} />
            <StatCard label="Avg Prep Time" value={stats.avgPrepTime} icon={prep_time_icon} />
            <StatCard label="Rejection Rate" value={`${stats.rejectionRate.toFixed(1)}%`} icon={rejection_rate_icon} />
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">{statsError ?? 'Unable to load metrics.'}</div>
        )}
      </section>

      {newOrderModal ? (

        <NewOrderOverlay
          order={newOrderModal}
          onAccept={handleConfirm}
          onReject={handleReject}
          onClose={() => {
            setNewOrderModal(null);
            setNewOrder(null);
          }}
        />
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          {orderSections.map(section => (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className={`flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                activeSection === section.key
                  ? 'bg-[#E7F7F0] text-[#1D915F] shadow-sm'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <img 
                src={section.icon} 
                className={`h-5 w-5 ${activeSection === section.key ? '' : 'opacity-40 grayscale'}`} 
                alt="" 
              />
              {section.label}
              <span className={`ml-1 flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-bold ${
                activeSection === section.key ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {sectionCounts[section.key]}
              </span>
            </button>
          ))}
        </div>

        {loadingOrders ? (
          <div className="grid gap-6">
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        ) : ordersError ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">{ordersError}</div>
        ) : (
          <div>
            {filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                <p className="text-base font-medium text-slate-400">No orders in {activeSection.toLowerCase()} stage</p>
              </div>
            ) : activeSection === 'HISTORY' ? (
              <HistoryTable orders={filteredOrders} />
            ) : (
              <div className="grid gap-6">
                {filteredOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdate={handleOrderUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {errorMessage && (
        <Toast
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
