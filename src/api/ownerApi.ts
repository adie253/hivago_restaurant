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

const getOwnerHeaders = () => {
  const token = localStorage.getItem('hivago_owner_access_token') || localStorage.getItem('hivago_access_token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const getOwnerOutlets = async (): Promise<RestaurantMinimal[]> => {
  const response = await client.get<RestaurantMinimal[]>('/owners/me/outlets', getOwnerHeaders());
  return response.data;
};

export const getOwnerProfile = async (): Promise<any> => {
  const response = await client.get<any>('/owners/me', getOwnerHeaders());
  return response.data;
};

export const switchOutlet = async (restaurantId: string): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>(`/owners/outlets/${restaurantId}/switch`, {}, getOwnerHeaders());
  return response.data;
};
