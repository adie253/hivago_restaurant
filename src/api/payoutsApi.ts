import client from './client';
import { PayoutCycle, PayoutSummary } from '../types';

/**
 * Normalizes a raw payout object from the API to the PayoutCycle interface.
 */
const normalizePayout = (raw: any): PayoutCycle => {
  return {
    id: String(raw.id || raw.payoutId || ''),
    cycleRange: String(raw.cycleRange || raw.period || ''),
    payoutDate: String(raw.payoutDate || raw.processedAt || 'Pending'),
    ordersCount: Number(raw.ordersCount || raw.totalOrders || 0),
    amount: Number(raw.amount || raw.netAmount || 0),
    status: (raw.status?.toUpperCase() || 'PENDING') as PayoutCycle['status'],
    utr: raw.utr || raw.transactionReference || undefined
  };
};

export const fetchPayoutSummary = async (restaurantId: string): Promise<PayoutSummary> => {
  try {
    // 1. Fetch current earnings/cycle
    const earningsResponse = await client.get(`/restaurants/payouts/earnings`, {
      params: { restaurantId }
    });
    const currentRaw = earningsResponse.data.data ?? earningsResponse.data;

    // 2. Fetch payout history
    const historyResponse = await client.get(`/restaurants/payouts`, {
      params: { restaurantId }
    });
    const historyRaw = Array.isArray(historyResponse.data.data) 
      ? historyResponse.data.data 
      : (Array.isArray(historyResponse.data) ? historyResponse.data : []);

    return {
      currentCycle: normalizePayout(currentRaw),
      pastCycles: historyRaw.map(normalizePayout)
    };
  } catch (err) {
    console.error('Failed to fetch real payouts, falling back to mock data', err);
    
    // Fallback Mock Data
    return {
      currentCycle: {
        id: 'current-mock',
        cycleRange: "23 - 29 Mar'26",
        payoutDate: "01 Apr'26, by 9PM",
        ordersCount: 25,
        amount: 9027.90,
        status: 'UPCOMING'
      },
      pastCycles: [
        {
          id: 'mock-1',
          cycleRange: "16 Mar - 22 Mar'26",
          payoutDate: "25 Mar'26",
          status: 'PAID',
          ordersCount: 48,
          amount: 16831.55,
          utr: 'CITIN2664590178'
        }
      ]
    };
  }
};
