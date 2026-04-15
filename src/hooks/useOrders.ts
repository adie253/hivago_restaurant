import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Order } from '../types';
import { fetchOrders } from '../api/dashboardApi';

export const useOrders = () => {
  const { user } = useAuth();
  const { lastOrderReceived } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousOrderIdsRef = useRef<string[]>([]);
  const initialLoadRef = useRef(false);

  const refreshOrders = async () => {
    if (!user?.id) {
      setOrders([]);
      setNewOrder(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchOrders(user.id, { activeOnly: false, pageSize: 100 });
      const latestOrders = Array.isArray(response) ? response : [];

      if (initialLoadRef.current) {
        const previousIds = new Set(previousOrderIdsRef.current);
        const newlyArrived = latestOrders.find(order => !previousIds.has(order.id));
        if (newlyArrived) {
          setNewOrder(newlyArrived);
        }
      }

      previousOrderIdsRef.current = latestOrders.map(order => order.id);
      setOrders(latestOrders);
      initialLoadRef.current = true;
    } catch (err) {
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
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
  }, [user?.id]);

  // Handle Real-Time Updates from SignalR
  useEffect(() => {
    if (lastOrderReceived) {
      console.log('Real-time order update received:', lastOrderReceived);
      refreshOrders();
    }
  }, [lastOrderReceived]);

  return { orders, newOrder, setNewOrder, refreshOrders, loading, error };
};
