export type OrderStatus = 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  customerName: string;
  customerNote?: string;
  pickupType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  createdAt: string;
  total: number;
  deliveryETA: string;
  items: OrderItem[];
  address: string;
}

export interface DashboardStats {
  liveOrders: number;
  todayRevenue: number;
  avgPrepTime: string;
  rejectionRate: number;
}
