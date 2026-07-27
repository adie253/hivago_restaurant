import client from './client';
import { 
  EarningsSummaryDto, 
  PayoutDto, 
  PayoutDetailDto, 
  GstSummaryDto, 
  TdsSummaryDto,
  RestaurantPayoutSummary,
  RestaurantPayoutsPagedResult,
  PayoutCycle,
  PayoutSummary
} from '../types';

/**
 * RESTAURANT PANEL APIS
 */

/**
 * GET /api/restaurants/payouts/earnings
 * Current week's running tally of money the restaurant has earned but not yet been paid out.
 */
export const fetchEarningsSummary = async (): Promise<EarningsSummaryDto> => {
  const response = await client.get('/restaurants/payouts/earnings');
  const data = response.data;
  if (data && Array.isArray(data.ledgerEntries)) {
    data.ledgerEntries = data.ledgerEntries.map((entry: any) => ({
      ...entry,
      orderNumber: entry.orderNumber || entry.orderNo || entry.order_number || entry.orderCode || (entry.orderId ? (String(entry.orderId).startsWith('ORD-') ? entry.orderId : String(entry.orderId).slice(-8).toUpperCase()) : 'N/A')
    }));
  }
  return data;
};

/**
 * GET /api/restaurants/payouts/
 * Paginated history of all weekly payout batches for this restaurant owner.
 */
export const fetchPayoutHistory = async (page = 1, pageSize = 20): Promise<PayoutDto[]> => {
  const response = await client.get('/restaurants/payouts', {
    params: { page, pageSize }
  });
  return response.data;
};

/**
 * GET /api/restaurants/payouts/{payoutId}
 * Full breakdown of one weekly payout, including every order that fed into it.
 */
export const fetchPayoutDetail = async (payoutId: string): Promise<PayoutDetailDto> => {
  const response = await client.get(`/restaurants/payouts/${payoutId}`);
  const data = response.data;
  if (data && Array.isArray(data.ledgerEntries)) {
    data.ledgerEntries = data.ledgerEntries.map((entry: any) => ({
      ...entry,
      orderNumber: entry.orderNumber || entry.orderNo || entry.order_number || entry.orderCode || (entry.orderId ? (String(entry.orderId).startsWith('ORD-') ? entry.orderId : String(entry.orderId).slice(-8).toUpperCase()) : 'N/A')
    }));
  }
  return data;
};

/**
 * GET /api/restaurants/payouts/gst-summary
 */
export const fetchGstSummary = async (from?: string, to?: string): Promise<GstSummaryDto> => {
  const response = await client.get('/restaurants/payouts/gst-summary', {
    params: { from, to }
  });
  return response.data;
};

/**
 * GET /api/restaurants/payouts/tds-summary
 */
export const fetchTdsSummary = async (from?: string, to?: string): Promise<TdsSummaryDto> => {
  const response = await client.get('/restaurants/payouts/tds-summary', {
    params: { from, to }
  });
  return response.data;
};


/**
 * ADMIN PANEL APIS
 */

/**
 * GET /api/admin/payouts/restaurant/summary
 */
export const fetchAdminPayoutSummary = async (): Promise<RestaurantPayoutSummary> => {
  const response = await client.get('/admin/payouts/restaurant/summary');
  return response.data;
};

/**
 * GET /api/admin/payouts/restaurant
 */
export const fetchAdminPayouts = async (params: {
  from?: string;
  to?: string;
  ownerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<RestaurantPayoutsPagedResult> => {
  const response = await client.get('/admin/payouts/restaurant', { params });
  return response.data;
};

/**
 * POST /api/admin/payouts/restaurant/{payoutId}/pay-now
 */
export const triggerPayoutNow = async (payoutId: string): Promise<{ transactionReference: string, status: string }> => {
  const response = await client.post(`/admin/payouts/restaurant/${payoutId}/pay-now`);
  return response.data;
};

/**
 * POST /api/admin/payouts/restaurant/{payoutId}/hold
 */
export const holdPayout = async (payoutId: string, reason?: string): Promise<void> => {
  await client.post(`/admin/payouts/restaurant/${payoutId}/hold`, { reason });
};

/**
 * POST /api/admin/payouts/restaurant/{payoutId}/release-hold
 */
export const releasePayoutHold = async (payoutId: string): Promise<void> => {
  await client.post(`/admin/payouts/restaurant/${payoutId}/release-hold`);
};

/**
 * POST /api/admin/payouts/restaurant/{payoutId}/retry
 */
export const retryPayout = async (payoutId: string): Promise<void> => {
  await client.post(`/admin/payouts/restaurant/${payoutId}/retry`);
};


/**
 * BACKWARD COMPATIBILITY WRAPPERS (TO BE DEPRECATED)
 */

export const fetchPayoutSummary = async (_restaurantId: string): Promise<PayoutSummary> => {
  try {
    const [earnings, history] = await Promise.all([
      fetchEarningsSummary(),
      fetchPayoutHistory(1, 50)
    ]);

    const normalizePayout = (p: PayoutDto): PayoutCycle => ({
      id: p.id,
      cycleRange: `${p.periodStart} - ${p.periodEnd}`,
      payoutDate: p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Pending',
      ordersCount: p.orderCount,
      amount: p.netPayoutAmount,
      status: p.status.toUpperCase(),
      utr: p.transactionReference
    });

    return {
      currentCycle: {
        id: 'current',
        cycleRange: `${earnings.periodStart} - ${earnings.periodEnd}`,
        payoutDate: 'Next Monday',
        ordersCount: earnings.orderCount,
        amount: earnings.netEarnings,
        status: 'UPCOMING'
      },
      pastCycles: history.map(normalizePayout)
    };
  } catch (err) {
    console.error('Failed to fetch real payouts', err);
    throw err;
  }
};
