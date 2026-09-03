import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NewRestaurantStats } from '../types';
import { fetchRestaurantStats } from '../api/dashboardApi';

export const useDashboardStats = (range: string = 'today') => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<NewRestaurantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user?.id) {
      setStats(null);
      setLoading(false);
      setError('Restaurant not authenticated.');
      return;
    }

    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchRestaurantStats(range);
        setStats(response);
      } catch (err) {
        setError('Unable to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.id, range, authLoading]);

  return { stats, loading: loading || authLoading, error, refreshStats: () => {
    if (user?.id) {
        fetchRestaurantStats(range).then(setStats).catch(console.error);
    }
  }};
};
