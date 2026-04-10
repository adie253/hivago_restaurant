import { useMemo, useState } from 'react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useOrders } from '../hooks/useOrders';
import OrderCard from '../components/OrderCard';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import { OrderStatus } from '../types';

const orderSections = [
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY', label: 'Ready' },
  { key: 'PICKED_UP', label: 'Picked up' },
  { key: 'HISTORY', label: 'Order History' }
] as const;

type OrderSectionKey = typeof orderSections[number]['key'];

const DashboardPage = () => {
  const [activeSection, setActiveSection] = useState<OrderSectionKey>('PREPARING');
  const { stats, loading: loadingStats, error: statsError } = useDashboardStats();
  const { orders, loading: loadingOrders, error: ordersError } = useOrders();

  const sectionCounts = useMemo(() => {
    const counts = {
      PREPARING: 0,
      READY: 0,
      PICKED_UP: 0,
      HISTORY: 0
    } as Record<OrderSectionKey, number>;

    orders.forEach(order => {
      if (order.status === 'PREPARING') counts.PREPARING += 1;
      if (order.status === 'READY') counts.READY += 1;
      if (order.status === 'PICKED_UP') counts.PICKED_UP += 1;
      if (order.status === 'DELIVERED') counts.HISTORY += 1;
    });

    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeSection === 'HISTORY') return order.status === 'DELIVERED';
      return order.status === activeSection;
    });
  }, [activeSection, orders]);

  return (
    <div className="space-y-6">
      <header className="rounded-[32px] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-brand-500">Live Orders</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Track every order in real time</h1>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            Connected to restaurant APIs
          </div>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-4">
        {loadingStats ? (
          <LoadingState />
        ) : stats ? (
          <>
            <StatCard label="Today's Orders" value={stats.liveOrders.toString()} helpText="Orders currently active" />
            <StatCard label="Today's Revenue" value={`₹${stats.todayRevenue.toLocaleString()}`} helpText="Sales collected today" />
            <StatCard label="Avg Prep Time" value={stats.avgPrepTime} helpText="Average kitchen prep time" />
            <StatCard label="Rejection Rate" value={`${stats.rejectionRate.toFixed(1)}%`} helpText="Orders rejected by kitchen" />
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">{statsError ?? 'Unable to load metrics.'}</div>
        )}
      </section>

      <section className="rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Live order queue</h2>
            <p className="text-sm text-slate-500">Switch between active order stages and order history.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {orderSections.map(section => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                  activeSection === section.key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {section.label}
                <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm">
                  {sectionCounts[section.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loadingOrders ? (
          <LoadingState />
        ) : ordersError ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">{ordersError}</div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                No orders available in this section.
              </div>
            ) : (
              filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
