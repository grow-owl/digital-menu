import { apiClient } from './api-client';
import { User, ApiResponse } from '../types/user.types';

export const authService = {
  async register(name: string, phone: string, password?: string): Promise<User & { token: string; accessToken?: string; refreshToken?: string }> {
    const response = await apiClient.post<ApiResponse<User & { token: string; accessToken?: string; refreshToken?: string }>>('/auth/register', { name, phone, password: password || 'defaultpass123' });
    return response.data.data;
  },

  async login(credentials: { identifier?: string; email?: string; phone?: string; password?: string } | string, passwordParam?: string): Promise<{ user: User; accessToken: string; token: string; refreshToken?: string }> {
    const payload = typeof credentials === 'string' 
      ? { identifier: credentials, password: passwordParam }
      : credentials;
    const response = await apiClient.post<ApiResponse<{ user: User; accessToken: string; token: string; refreshToken?: string }>>('/auth/login', payload);
    return response.data.data;
  },

  async loginWithPhone(phone: string, name?: string): Promise<{ user: User; accessToken: string; token: string; refreshToken?: string; isNewUser?: boolean; welcomeBonus?: number }> {
    const response = await apiClient.post<ApiResponse<{ user: User; accessToken: string; token: string; refreshToken?: string; isNewUser?: boolean; welcomeBonus?: number }>>('/auth/phone-login', { phone, name });
    return response.data.data;
  },

  async refreshAccessToken(refreshToken: string): Promise<{ token: string; accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<ApiResponse<{ token: string; accessToken: string; refreshToken: string }>>('/auth/refresh-token', { refreshToken });
    return response.data.data;
  },

  async updateProfile(userId: string, name: string, phone: string): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', { userId, name, phone });
    return response.data.data;
  },

  async verifyTerminal(passcode: string): Promise<{ success: boolean; authorized: boolean }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; authorized: boolean }>>('/auth/verify-terminal', { passcode });
    return response.data as any;
  }
};

