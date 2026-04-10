import { Order } from '../types';
import { formatCurrency, formatRelativeTime } from '../utils/format';

interface OrderCardProps {
  order: Order;
}

const statusStyles: Record<string, string> = {
  PREPARING: 'bg-amber-100 text-amber-700',
  READY: 'bg-emerald-100 text-emerald-700',
  PICKED_UP: 'bg-sky-100 text-sky-700',
  DELIVERED: 'bg-slate-100 text-slate-700'
};

const OrderCard = ({ order }: OrderCardProps) => {
  return (
    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              {order.pickupType}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {order.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-950">#{order.id}</h3>
            <p className="mt-1 text-sm text-slate-500">{order.customerName} · {order.address}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-500">
            <span>{formatRelativeTime(order.deliveryETA)} ETA</span>
            <span>·</span>
            <span>Total ₹{order.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <button className="rounded-3xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
            Order ready
          </button>
          <p className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Total bill Paid
          </p>
        </div>
      </div>

      {order.customerNote ? (
        <div className="mt-5 rounded-[28px] bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <span className="font-semibold">Customer Note:</span> {order.customerNote}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {order.items.map(item => (
          <div key={item.id} className="rounded-3xl bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium text-slate-900">{item.name}</p>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">x{item.quantity}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{formatCurrency(item.price)}</p>
          </div>
        ))}
      </div>
    </article>
  );
};

export default OrderCard;
