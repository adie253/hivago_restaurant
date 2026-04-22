export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';

export type OrderSectionKey = 'PENDING' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'HISTORY';


export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  description?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;

  customerName: string;
  customerPhone: string;
  customerNote?: string;
  pickupType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  createdAt: string;
  total: number;
  subTotal?: number;
  tax?: number;
  discount?: number;
  deliveryETA: string;
  items: OrderItem[];
  address: string;
  paymentVerified?: boolean;
  riderName?: string;
  riderPhone?: string;
  riderStatus?: string;
  otp?: string;
}


export interface DashboardStats {
  liveOrders: number;
  todayRevenue: number;
  avgPrepTime: string;
  rejectionRate: number;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  menuId: string;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  fssaiNumber: string;
  address: string;
  description: string;
  openingHours?: OpeningHours;
  minOrderAmount?: number;
  hasJainOptions?: boolean;
  isVeganFriendly?: boolean;
  isPureVeg?: boolean;
  
  // Delivery Settings
  defaultPrepTime?: number;
  defaultDeliveryPartner?: string;
  isAcceptingOrders?: boolean;
  isAutoAcceptEnabled?: boolean;
  isAutoWorkingHoursEnabled?: boolean;
  isPickupEnabled?: boolean;
  isDeliveryEnabled?: boolean;
  logoUrl?: string;
}

export interface TimeSlot {
  from: string; // "09:00"
  to: string;   // "22:00"
}

export interface DayHours {
  isClosed: boolean;
  slots: TimeSlot[];
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface PayoutCycle {
  id: string;
  cycleRange: string;
  payoutDate: string;
  ordersCount: number;
  amount: number;
  status: 'PAID' | 'PENDING' | 'UPCOMING';
  utr?: string;
}

export interface PayoutSummary {
  currentCycle: PayoutCycle;
  pastCycles: PayoutCycle[];
}

