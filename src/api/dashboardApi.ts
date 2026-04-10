import { DashboardStats, Order } from '../types';
import client from './client';

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await client.get<DashboardStats>('/dashboard/stats');
  return response.data;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await client.get<Order[]>('/orders');
  return response.data;
};
