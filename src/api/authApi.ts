import client from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  restaurantId: string;
  name: string;
  accessToken: string;  
  refreshToken: string;
  accessTokenExpiresAt: string;
}

export const loginRestaurant = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/restaurants/login', credentials);
  return response.data;
};

export const sendRestaurantOtp = async (phoneNumber: string): Promise<{ success: boolean; message?: string }> => {
  const response = await client.post('/restaurants/otp/send', { phoneNumber });
  return response.data;
};

export const verifyRestaurantOtp = async (phoneNumber: string, otp: string): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/restaurants/otp/verify', { phoneNumber, otp });
  return response.data;
};

export const refreshAuthToken = async (refreshToken: string): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/auth/refresh', { refreshToken });
  return response.data;
};
