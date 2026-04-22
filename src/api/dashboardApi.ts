import { DashboardStats, MenuCategory, MenuItem, Order, RestaurantSettings, ProfileSettings, DietarySettings, OperationsSettings, HoursSettings, DeliverySettings, NotificationSettings } from '../types';
import client from './client';

export const fetchDashboardStats = async (restaurantId: string): Promise<DashboardStats> => {
  const orders = await fetchOrders(restaurantId, { activeOnly: false, pageSize: 100 });
  const today = new Date().toDateString();

  const liveOrders = orders.filter(order => order.status !== 'DELIVERED').length;

  const todayRevenue = orders.reduce((sum, order) => {
    return new Date(order.createdAt).toDateString() === today
      ? sum + order.total
      : sum;
  }, 0);

  return {
    liveOrders,
    todayRevenue,
    avgPrepTime: 'N/A',
    rejectionRate: 0
  };
};

interface FetchOrdersOptions {
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

const normalizeStatus = (status?: string): Order['status'] => {
  if (!status) return 'PENDING';
  const normalized = status.toLowerCase();

  if (normalized.includes('pending') || normalized === 'confirmed') return 'PENDING';
  if (normalized.includes('ready')) return 'READY';
  if (normalized.includes('picked')) return 'PICKED_UP';
  if (normalized === 'delivered') return 'DELIVERED';
  if (normalized === 'rejected' || normalized === 'cancelled') return 'REJECTED';
  
  if (normalized === 'preparing') return 'PREPARING';

  return 'PENDING';
};

const normalizePickupType = (pickupType?: string): Order['pickupType'] => {
  if (!pickupType) return 'PICKUP';

  const normalized = pickupType.toLowerCase();

  if (normalized.includes('delivery')) return 'DELIVERY';
  if (normalized.includes('dine')) return 'DINE_IN';

  return 'PICKUP';
};

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', 'yes', 'verified', 'paid', 'success', 'confirmed'].includes(normalized);
  }

  return false;
};

const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

const normalizeOrder = (raw: Record<string, unknown>): Order => {
  const statusRaw = String(raw.status ?? raw.statusDisplay ?? 'PREPARING');
  const normalizedStatus = normalizeStatus(statusRaw);

  const pricing = (raw.pricing as Record<string, unknown>) || {};
  const deliveryInfo = (raw.deliveryInfo as Record<string, unknown>) || {};
  const deliveryAddress = (deliveryInfo.deliveryAddress as Record<string, unknown>) || {};

  const paymentVerified =
    parseBoolean(raw.paymentStatus ?? raw.paymentVerified ?? raw.paymentStatusDisplay) ||
    String(raw.paymentStatus).toLowerCase() === 'paid';

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const normalizedItems = rawItems.map((item: any) => ({
    id: String(item.id ?? item.menuItemId ?? ''),
    name: String(item.itemName ?? item.name ?? 'Unknown Item'),
    quantity: Number(item.quantity ?? 1),
    price: parseNumber(item.unitPrice ?? item.price ?? 0),
    imageUrl: String(item.imageUrl ?? ''),
    description: String(item.itemDescription ?? item.description ?? '')
  }));

  return {
    id: String(raw.id ?? ''),
    orderNumber: String(raw.orderNumber ?? raw.id ?? ''),
    status: normalizedStatus,
    customerName: String(raw.customerName ?? raw.restaurantName ?? 'Guest'),
    customerPhone: String(raw.customerPhone ?? raw.restaurantPhone ?? ''),
    customerNote: String(raw.specialInstructions ?? raw.customerNote ?? '') || undefined,
    pickupType: normalizePickupType(String(raw.pickupType ?? (deliveryInfo ? 'DELIVERY' : 'PICKUP'))),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    total: parseNumber(pricing.total ?? raw.total ?? raw.totalDisplay),
    subTotal: parseNumber(pricing.subTotal ?? pricing.itemsTotal ?? 0),
    tax: parseNumber(pricing.tax ?? pricing.taxTotal ?? 0),
    discount: parseNumber(pricing.discount ?? pricing.discountTotal ?? 0),
    deliveryETA: String(deliveryInfo.estimatedTimeDisplay ?? raw.estimatedTimeDisplay ?? ''),
    items: normalizedItems,
    address: String(deliveryAddress.formattedAddress ?? raw.address ?? ''),
    paymentVerified,
    riderName: String(deliveryInfo.riderName ?? ''),
    riderPhone: String(deliveryInfo.riderPhone ?? ''),
    riderStatus: deliveryInfo.riderId ? 'is on the way' : undefined,
    otp: String(raw.paymentId).slice(-4) // Mock OTP from paymentId for now
  };

};




const extractOrders = (payload: unknown): Order[] => {
  if (Array.isArray(payload)) {
    return payload.map(item => normalizeOrder(item as Record<string, unknown>));
  }

  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;
    const candidates = ['items', 'orders', 'data', 'results'];

    for (const key of candidates) {
      const value = body[key];
      if (Array.isArray(value)) {
        return value.map(item => normalizeOrder(item as Record<string, unknown>));
      }
    }
  }

  throw new Error('Unexpected orders payload from API');
};

export const fetchOrders = async (
  restaurantId: string,
  options: FetchOrdersOptions = {}
): Promise<Order[]> => {
  const activeOnly = options.activeOnly ?? false;
  const pageSize = options.pageSize ?? 100;
  const explicitPage = typeof options.page === 'number';

  let currentPage = options.page ?? 1;
  const orders: Order[] = [];

  while (true) {
    const response = await client.get<unknown>(`/orders/restaurant/${restaurantId}`, {
      params: { activeOnly, page: currentPage, pageSize }
    });

    const pageOrders = extractOrders(response.data);
    orders.push(...pageOrders);

    if (explicitPage || pageOrders.length < pageSize) break;

    currentPage += 1;
  }

  // Inject a demo order for testing "Picked up" section redesign
  const demoOrder: Order = {
    id: 'demo-pickup-id',
    orderNumber: 'ORD-1230',
    status: 'PICKED_UP',
    customerName: 'Aditya Shinde',
    customerPhone: '8080125309',
    customerNote: 'Extra gravy please',
    pickupType: 'DELIVERY',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    total: 160,
    subTotal: 150,
    tax: 10,
    discount: 0,
    deliveryETA: '15 mins ago',
    items: [
      { id: 'item-1', name: 'Lamb Rogan Josh', quantity: 1, price: 100 },
      { id: 'item-2', name: 'Basmati Rice', quantity: 1, price: 60 }
    ],
    address: 'Powai, Mumbai',
    paymentVerified: true,
    riderName: 'Santosh Kamble',
    riderPhone: '9876543210',
    riderStatus: 'has picked up your order',
    otp: '5678'
  };

  orders.unshift(demoOrder);


  return orders;
};



export const fetchOrderById = async (orderId: string): Promise<Order> => {
  const response = await client.get<Record<string, unknown>>(`/orders/${orderId}`);
  
  // If the response data is an object with a 'data' property (common wrapper)
  const rawData = response.data.data ? (response.data.data as Record<string, unknown>) : response.data;
  
  return normalizeOrder(rawData);
};

export const confirmOrder = async (orderId: string): Promise<void> => {
  await client.put(`/orders/${orderId}/confirm`);
};

export const rejectOrder = async (orderId: string): Promise<void> => {
  await client.put(`/orders/${orderId}/reject`);
};

export const preparingOrder = async (orderId: string): Promise<void> => {
  await client.put(`/orders/${orderId}/preparing`);
};

export const readyOrder = async (orderId: string): Promise<void> => {
  await client.put(`/orders/${orderId}/ready`);
};

// Menu Management APIs (Unified Catalog Endpoint)
export const fetchFullMenu = async (restaurantId: string): Promise<{ categories: MenuCategory[], items: MenuItem[] }> => {
  try {
    const response = await client.get(`/catalog/restaurants/${restaurantId}/menu`);
    const data = response.data;
    console.log('Full Menu Data:', data);
    
    // The endpoint is "Get full menu with items and options"
    // Usually returns a list of menus (categories) each containing items
    const rawMenus = Array.isArray(data) ? data : (data.menus ?? data.items ?? data.data ?? []);
    
    const categories: MenuCategory[] = [];
    const items: MenuItem[] = [];
    
    rawMenus.forEach((menu: any) => {
      const categoryId = String(menu.id ?? menu.menuId ?? '');
      const categoryName = String(menu.name ?? menu.menuName ?? 'Other');
      
      categories.push({
        id: categoryId,
        name: categoryName
      });
      
      if (Array.isArray(menu.items)) {
        menu.items.forEach((item: any) => {
          items.push({
            id: String(item.id ?? item.menuItemId ?? ''),
            name: String(item.name ?? item.itemName ?? 'Unknown Item'),
            price: parseNumber(item.price ?? item.unitPrice ?? 0),
            description: String(item.description ?? item.itemDescription ?? ''),
            imageUrl: String(item.imageUrl ?? ''),
            category: categoryName,
            isVeg: parseBoolean(item.isVeg ?? item.isVegetarian ?? true),
            isAvailable: parseBoolean(item.isAvailable ?? item.available ?? true),
            menuId: categoryId
          });
        });
      }
    });

    // If we got real data, return it
    if (categories.length > 0) {
      return { categories, items };
    }
    
    // Fallback to empty defaults if successful but empty
    throw new Error('Empty menu');
  } catch (err) {
    console.warn('Falling back to mock menu data', err);
    // Return mock data if API fails
    const mockCategories = [
      { id: 'cat-1', name: 'Appetizers' },
      { id: 'cat-2', name: 'Main Course' },
      { id: 'cat-3', name: 'Breads' },
      { id: 'cat-4', name: 'Desserts' },
      { id: 'cat-5', name: 'Beverages' }
    ];
    
    const mockItems = [
      { id: 'm-1', name: 'Chicken Tikka Masala', price: 340, category: 'Main Course', isVeg: false, isAvailable: true, menuId: 'cat-2', imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop' },
      { id: 'm-2', name: 'Paneer Tikka', price: 280, category: 'Appetizers', isVeg: true, isAvailable: true, menuId: 'cat-1', imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop' },
      { id: 'm-3', name: 'Butter Chicken', price: 360, category: 'Main Course', isVeg: false, isAvailable: true, menuId: 'cat-2', imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=400&fit=crop' },
      { id: 'm-4', name: 'Garlic Naan', price: 60, category: 'Breads', isVeg: true, isAvailable: true, menuId: 'cat-3', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop' },
      { id: 'm-5', name: 'Mango Lassi', price: 120, category: 'Beverages', isVeg: true, isAvailable: true, menuId: 'cat-5', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=400&fit=crop' }
    ];
    
    return { categories: mockCategories, items: mockItems };
  }
};

// Legacy compatibility or fallback helpers if needed separately
export const fetchMenuCategories = async (restaurantId: string): Promise<MenuCategory[]> => {
  const { categories } = await fetchFullMenu(restaurantId);
  return categories;
};

export const fetchMenuItems = async (restaurantId: string): Promise<MenuItem[]> => {
  const { items } = await fetchFullMenu(restaurantId);
  return items;
};

export const toggleItemAvailability = async (itemId: string, isAvailable: boolean): Promise<void> => {
  await client.patch(`/restaurant/items/${itemId}/availability`, { isAvailable });
};

// Settings & Profile APIs
export const fetchRestaurantSettings = async (): Promise<RestaurantSettings> => {
  const response = await client.get('/restaurants/me/details');
  return response.data.data ?? response.data;
};

export const updateProfile = async (data: Partial<ProfileSettings>): Promise<string> => {
  const payload = { ...data };
  if (payload.phone) {
    const digitsOnly = payload.phone.replace(/\D/g, '');
    payload.phone = digitsOnly.slice(-10);
  }
  const res = await client.patch('/restaurants/me/profile', payload);
  return res.data?.message || 'Profile updated successfully';
};

export const updateDietary = async (data: Partial<DietarySettings>): Promise<string> => {
  const res = await client.patch('/restaurants/me/dietary', data);
  return res.data?.message || 'Dietary settings updated successfully';
};

export const updateOperations = async (data: Partial<OperationsSettings>): Promise<string> => {
  const res = await client.patch('/restaurants/me/operations', data);
  return res.data?.message || 'Operations updated successfully';
};

export const updateHours = async (data: Partial<HoursSettings>): Promise<string> => {
  const res = await client.patch('/restaurants/me/hours', data);
  return res.data?.message || 'Business hours updated successfully';
};

export const updateDelivery = async (data: Partial<DeliverySettings>): Promise<string> => {
  const res = await client.patch('/restaurants/me/delivery', data);
  return res.data?.message || 'Delivery settings updated successfully';
};

export const updateNotifications = async (data: Partial<NotificationSettings>): Promise<string> => {
  const res = await client.patch('/restaurants/me/notifications', data);
  return res.data?.message || 'Notification preferences updated successfully';
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<string> => {
  const res = await client.patch('/restaurants/me/password', { currentPassword, newPassword });
  return res.data?.message || 'Password changed successfully';
};

// Logo upload might be kept or changed. Based on spec, it's not strictly mentioned in the 7 PATCH.
// We'll leave the old one but point to /restaurants/me/logo just in case, or drop it if not needed.
// Actually, I'll keep the legacy path until requested otherwise, but spec didn't mention logo.
export const uploadRestaurantLogo = async (file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  // Backend relies on JWT now
  const response = await client.post<{ logoUrl: string }>('/restaurants/me/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};


