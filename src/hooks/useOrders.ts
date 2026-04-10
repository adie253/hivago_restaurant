import { useEffect, useState } from 'react';
import { Order } from '../types';
import { fetchOrders } from '../api/dashboardApi';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchOrders();
        setOrders(response);
      } catch (err) {
        setError('Unable to load orders.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return { orders, loading, error };
};
