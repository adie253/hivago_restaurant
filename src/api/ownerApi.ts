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

export const getOwnerOutlets = async (): Promise<RestaurantMinimal[]> => {
  const token = getOwnerToken();
  const response = await client.get<RestaurantMinimal[]>('/owners/me/outlets', {
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


