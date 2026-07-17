import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderStatus } from '../types';
import { formatRelativeTime } from '../utils/format';

interface TimelineEvent {
  status: OrderStatus | 'PLACED';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const timelineEvents: TimelineEvent[] = [
  {
    status: 'PLACED',
    label: 'Order Placed',
    description: 'Order was successfully placed by the customer',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    status: 'PENDING',
    label: 'Order Confirmed',
    description: 'Restaurant has seen and is confirming the order',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    status: 'PREPARING',
    label: 'Preparing',
    description: 'Food is being prepared in the kitchen',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    status: 'READY',
    label: 'Ready for Pickup',
    description: 'Order is packed and ready for the rider',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    status: 'PICKED_UP',
    label: 'Out for Delivery',
    description: 'Rider has picked up the order and is on the way',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    status: 'DELIVERED',
    label: 'Delivered',
    description: 'Order has been successfully delivered to the customer',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 21a11.955 11.955 0 01-9.618-7.016m19.236 0A11.952 11.952 0 0012 3a11.952 11.952 0 00-9.618 4.016" />
      </svg>
    ),
  },
];

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

const statusOrder: (OrderStatus | 'PLACED')[] = [
  'PLACED',
  'PENDING',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'DELIVERED',
];

const TimelineModal = ({ isOpen, onClose, order }: TimelineModalProps) => {
  // Special case for REJECTED or CANCELLED
  const isRejected = order.status === 'REJECTED' || !!order.rejectionReason;
  const isCancelled = order.status === 'CANCELLED' || (!!order.cancellationReason && !order.rejectionReason);
  const isTerminated = isRejected || isCancelled;

  const getTimelineEvents = () => {
    const events: {
      status: OrderStatus | 'PLACED';
      label: string;
      description: string;
      icon: React.ReactNode;
      time?: string;
      completed: boolean;
      isError?: boolean;
    }[] = [];
    
    // Placed
    events.push({
      status: 'PLACED' as OrderStatus | 'PLACED',
      label: 'Order Placed',
      description: 'Order was successfully placed by the customer',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      time: order.createdAt,
      completed: true
    });
    
    // Confirmed
    events.push({
      status: 'PENDING' as OrderStatus | 'PLACED',
      label: 'Order Confirmed',
      description: 'Restaurant has seen and is confirming the order',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      time: order.confirmedAt,
      completed: !!order.confirmedAt
    });
    
    // Preparing
    events.push({
      status: 'PREPARING' as OrderStatus | 'PLACED',
      label: 'Preparing',
      description: 'Food is being prepared in the kitchen',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      time: order.preparingAt,
      completed: !!order.preparingAt
    });

    // Ready
    events.push({
      status: 'READY' as OrderStatus | 'PLACED',
      label: 'Ready for Pickup',
      description: 'Order is packed and ready for the rider',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
      time: order.readyAt,
      completed: !!order.readyAt
    });

    // Out for Delivery
    events.push({
      status: 'PICKED_UP' as OrderStatus | 'PLACED',
      label: 'Out for Delivery',
      description: 'Rider has picked up the order and is on the way',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      time: order.pickedUpAt,
      completed: !!order.pickedUpAt
    });

    // Delivered
    events.push({
      status: 'DELIVERED' as OrderStatus | 'PLACED',
      label: 'Delivered',
      description: 'Order has been successfully delivered to the customer',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 21a11.955 11.955 0 01-9.618-7.016m19.236 0A11.952 11.952 0 0012 3a11.952 11.952 0 00-9.618 4.016" />
        </svg>
      ),
      time: order.deliveredAt,
      completed: !!order.deliveredAt && order.status === 'DELIVERED'
    });

    // Cancelled / Rejected (Terminal step insertion)
    if (isCancelled) {
      const lastCompletedIdx = events.map(e => e.completed).lastIndexOf(true);
      const cancelEvent = {
        status: 'CANCELLED' as OrderStatus | 'PLACED',
        label: 'Order Cancelled',
        description: order.cancellationReason ? `Reason: ${order.cancellationReason}` : 'The order was cancelled.',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        time: order.cancelledAt || order.deliveredAt || new Date().toISOString(),
        completed: true,
        isError: true
      };
      events.splice(lastCompletedIdx + 1, 0, cancelEvent);
    } else if (isRejected) {
      const lastCompletedIdx = events.map(e => e.completed).lastIndexOf(true);
      const rejectEvent = {
        status: 'REJECTED' as OrderStatus | 'PLACED',
        label: 'Order Rejected',
        description: order.rejectionReason ? `Reason: ${order.rejectionReason}` : 'The order was rejected.',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        time: order.rejectedAt || order.deliveredAt || new Date().toISOString(),
        completed: true,
        isError: true
      };
      events.splice(lastCompletedIdx + 1, 0, rejectEvent);
    }

    return events;
  };

  const dynamicEvents = getTimelineEvents();
  const lastCompletedIndex = dynamicEvents.map(e => e.completed).lastIndexOf(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl"
            >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Order Timeline</h3>
                  <p className="text-sm font-bold text-slate-400">#{order.orderNumber}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-slate-100">
                {dynamicEvents.map((event, index) => {
                  const isCompleted = event.completed;
                  const isLastCompleted = !isTerminated && index === lastCompletedIndex;
                  const eventTime = event.time;

                  return (
                    <div key={event.label} className="relative flex gap-6">
                      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm transition-colors duration-500 ${
                        event.isError
                          ? 'bg-rose-500 text-white'
                          : isCompleted 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {event.icon}
                        {isLastCompleted && (
                          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25" />
                        )}
                      </div>

                      <div className="flex flex-col pt-1 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-sm font-bold transition-colors duration-500 ${
                            event.isError
                              ? 'text-rose-600'
                              : isCompleted 
                              ? 'text-slate-900' 
                              : 'text-slate-400'
                          }`}>
                            {event.label}
                          </span>
                          {eventTime && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded whitespace-nowrap ${
                              event.isError
                                ? 'text-rose-600 bg-rose-50'
                                : 'text-emerald-600 bg-emerald-50'
                            }`}>
                              {formatRelativeTime(String(eventTime))}
                            </span>
                          )}
                        </div>
                        <span className={`mt-0.5 text-xs font-bold transition-colors duration-500 ${
                          event.isError
                            ? 'text-rose-500 font-semibold'
                            : isCompleted 
                            ? 'text-slate-500' 
                            : 'text-slate-300'
                        }`}>
                          {event.description}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={onClose}
                className="mt-10 w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-[0.98]"
              >
                Close Timeline
              </button>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TimelineModal;
