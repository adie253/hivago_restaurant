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

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface WeeklyScheduleSlot {
  opensAt: string; // "09:00" or "09:00:00"
  closesAt: string;
}

export interface DaySchedule {
  dayOfWeek: DayOfWeek | string;
  slots: WeeklyScheduleSlot[];
}

export interface ProfileSettings {
  name: string;
  phone: string;
  email: string;
  fssaiNumber: string | null;
  addressLine: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  logoUrl: string | null;
}

export interface DietarySettings {
  dietaryType: "PureVeg" | "PureNonVeg" | "Both";
  isPureVeg: boolean;
  isVeganFriendly: boolean;
  hasJainOptions: boolean;
  cuisineTypes: string[];
}

export interface OperationsSettings {
  isActive: boolean;
  isAcceptingOrders: boolean;
  autoAcceptOrders: boolean;
  avgPrepTimeMins: number;
  minOrderAmount: number;
  commissionPercentage: number;
}

export interface HoursSettings {
  useCustomSchedule: boolean;
  openingTime: string;
  closingTime: string;
  weeklySchedule: DaySchedule[];
}

export interface DeliverySettings {
  deliveryMode: "Hivago" | "SelfDelivery";
}

export interface NotificationSettings {
  emailAlerts: boolean;
  browserNotifications: boolean;
  orderSound: boolean;
}

export interface RestaurantSettings {
  id: string;
  profile: ProfileSettings;
  dietary: DietarySettings;
  operations: OperationsSettings;
  hours: HoursSettings;
  delivery: DeliverySettings;
  notifications: NotificationSettings;
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

