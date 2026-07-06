import client from './client';
import { RestaurantMinimal } from '../types';
import { LoginCredentials, LoginResponse } from './authApi';

export interface OwnerLoginResponse extends LoginResponse {
  ownerId: string;
  role: 'owner';
}

export const loginOwner = async (credentials: LoginCredentials): Promise<OwnerLoginResponse> => {
  const response = await client.post<OwnerLoginResponse>('/owners/login', credentials);
  return response.data;
};

const getOwnerToken = () => {
  return localStorage.getItem('hivago_owner_access_token') || sessionStorage.getItem('hivago_owner_access_token');
};

export interface Outlet {
  id: string;
  name: string;
  rstCode: string;
  email: string;
  addressLine: string;
  isActive: boolean;
  isAcceptingOrders: boolean;
  logoUrl: string | null;
}

export interface BulkAvailabilityResult {
  updatedCount: number;
  skippedCount: number;
}

export const getOwnerOutlets = async (): Promise<Outlet[]> => {
  const token = getOwnerToken();
  const response = await client.get<Outlet[]>('/owners/me/outlets', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const updateOutletAvailability = async (outletId: string, isAcceptingOrders: boolean): Promise<any> => {
  const token = getOwnerToken();
  const response = await client.put(`/owners/me/outlets/${outletId}/availability`, { isAcceptingOrders }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const updateAllOutletsAvailability = async (isAcceptingOrders: boolean): Promise<BulkAvailabilityResult> => {
  const token = getOwnerToken();
  const response = await client.put<BulkAvailabilityResult>('/owners/me/outlets/availability', { isAcceptingOrders }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const getOwnerProfile = async (): Promise<any> => {
  const token = getOwnerToken();
  const response = await client.get<any>('/owners/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const switchOutlet = async (restaurantId: string): Promise<LoginResponse> => {
  const token = getOwnerToken();
  const response = await client.post<LoginResponse>(`/owners/outlets/${restaurantId}/switch`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export interface UpdateBankDetailsPayload {
  bankAccountNumber: string;
  bankIfscCode: string;
  bankAccountName: string;
}

export const updateOwnerBankDetails = async (payload: UpdateBankDetailsPayload): Promise<any> => {
  const token = getOwnerToken();
  const response = await client.put('/owners/me/bank', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};
