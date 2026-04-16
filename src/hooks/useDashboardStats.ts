import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardStats } from '../types';
import { fetchDashboardStats } from '../api/dashboardApi';

export const useDashboardStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        const response = await fetchDashboardStats(user.id);
        setStats(response);
      } catch (err) {
        setError('Unable to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.id]);

  return { stats, loading, error };
};
