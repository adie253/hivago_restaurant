import { Order } from '../types';

const ORDER_LIST_CACHE_KEY_PREFIX = 'hivago_orders_cache_';
const ORDER_CARD_DETAIL_CACHE_PREFIX = 'hivago_order_detail_cache_';

/**
 * Save list of order cards to cache for a given restaurant ID
 */
export const saveOrdersToCache = (restaurantId: string, orders: Order[]): void => {
  try {
    if (typeof window === 'undefined' || !restaurantId) return;
    const cacheKey = `${ORDER_LIST_CACHE_KEY_PREFIX}${restaurantId}`;
    sessionStorage.setItem(cacheKey, JSON.stringify(orders));
  } catch (err) {
    console.warn('[OrderCache] Failed to save orders to cache:', err);
  }
};

/**
 * Retrieve cached list of order cards for a given restaurant ID
 */
export const getCachedOrders = (restaurantId: string): Order[] | null => {
  try {
    if (typeof window === 'undefined' || !restaurantId) return null;
    const cacheKey = `${ORDER_LIST_CACHE_KEY_PREFIX}${restaurantId}`;
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn('[OrderCache] Failed to read cached orders:', err);
    return null;
  }
};

/**
 * Save single order card details (items, codes, customer info) to cache
 */
export const saveOrderDetailToCache = (orderId: string, orderDetail: Partial<Order>): void => {
  try {
    if (typeof window === 'undefined' || !orderId) return;
    const cacheKey = `${ORDER_CARD_DETAIL_CACHE_PREFIX}${orderId}`;
    const existing = getCachedOrderDetail(orderId) || {};
    const merged = { ...existing, ...orderDetail };
    sessionStorage.setItem(cacheKey, JSON.stringify(merged));
  } catch (err) {
    console.warn('[OrderCache] Failed to save order detail to cache:', err);
  }
};

/**
 * Retrieve cached single order details by order ID
 */
export const getCachedOrderDetail = (orderId: string): Partial<Order> | null => {
  try {
    if (typeof window === 'undefined' || !orderId) return null;
    const cacheKey = `${ORDER_CARD_DETAIL_CACHE_PREFIX}${orderId}`;
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[OrderCache] Failed to read cached order detail:', err);
    return null;
  }
};

/**
 * Update an order card in cache
 */
export const updateOrderInCache = (restaurantId: string, updatedOrder: Order): void => {
  try {
    if (!restaurantId) return;
    const currentList = getCachedOrders(restaurantId);
    if (currentList) {
      const updatedList = currentList.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
      saveOrdersToCache(restaurantId, updatedList);
    }
    saveOrderDetailToCache(updatedOrder.id, updatedOrder);
  } catch (err) {
    console.warn('[OrderCache] Failed to update order in cache:', err);
  }
};
