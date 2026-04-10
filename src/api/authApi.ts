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
