import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Order } from '../types';
import { fetchOrders, normalizeOrder } from '../api/dashboardApi';

export const useOrders = () => {
  const { user } = useAuth();
  const { lastOrderReceived, clearLastOrderReceived, stopNotification, playNotification, showBrowserNotification } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrder, setNewOrderState] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setNewOrder = (order: Order | null) => {
    setNewOrderState(order);
    if (!order) {
      stopNotification();
    }
  };
  const previousOrderIdsRef = useRef<string[]>([]);
  const initialLoadRef = useRef(false);

  const refreshOrders = async (silent = false) => {
    if (!user?.id) {
      setOrders([]);
      setNewOrder(null);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetchOrders(user.id, { activeOnly: false, pageSize: 100 });
      const allOrders = Array.isArray(response) ? response : [];
      
      // Filter out orders with pending payment status
      const latestOrders = allOrders.filter(order => 
        order.paymentStatus?.toUpperCase() !== 'PENDING'
      );

      if (initialLoadRef.current) {
        const previousIds = new Set(previousOrderIdsRef.current);
        const newlyArrived = latestOrders.find(order => !previousIds.has(order.id));
        if (newlyArrived && newlyArrived.status === 'PENDING') {
          setNewOrder(newlyArrived);
          playNotification();
          showBrowserNotification(newlyArrived);
        }
      }

      previousOrderIdsRef.current = latestOrders.map(order => order.id);
      setOrders(latestOrders);
      initialLoadRef.current = true;
    } catch (err) {
      setError('Unable to load orders.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setLoading(false);
      setError('Restaurant not authenticated.');
      return;
    }

    refreshOrders();

    const timer = setInterval(() => {
      refreshOrders(true);
    }, 15000);

    return () => clearInterval(timer);
  }, [user?.id]);

  // Handle Real-Time Updates from SignalR
  useEffect(() => {
    if (lastOrderReceived) {
      console.log('Real-time order update received:', lastOrderReceived);
      
      // Normalize the SignalR payload using the robust dashboardApi normalizer
      const normalizedOrder = normalizeOrder(lastOrderReceived);
      
      // Force status to PENDING since it is received via NewOrderReceived event
      normalizedOrder.status = 'PENDING';
      
      // Instantly open the popup when the event triggers (ensuring it matches the sound play)
      setNewOrder(normalizedOrder);
      
      // Clear it from the notification context so we don't process it again on remount
      clearLastOrderReceived();
      
      // Debounce the refresh to avoid hammering the server if many updates arrive
      const timer = setTimeout(() => {
        refreshOrders();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [lastOrderReceived]);

  const updateLocalOrder = (updatedOrder: Order) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
      const remainingPending = next.filter(o => o.status === 'PENDING');
      if (remainingPending.length === 0) {
        stopNotification();
      }
      return next;
    });
  };

  return { orders, newOrder, setNewOrder, refreshOrders, updateLocalOrder, loading, error };
};
