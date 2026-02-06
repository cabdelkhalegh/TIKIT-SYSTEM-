import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@/types/auth.types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<any>('/auth/login', credentials);
    // Backend returns { success: true, data: { userAccount, authToken } }
    // Transform to match frontend interface { token, user }
    return {
      token: response.data.data.authToken,
      user: {
        id: response.data.data.userAccount.userId,
        email: response.data.data.userAccount.email,
        fullName: response.data.data.userAccount.fullName,
        role: response.data.data.userAccount.role,
        profileImage: response.data.data.userAccount.profileImageUrl,
        createdAt: response.data.data.userAccount.createdAt,
        updatedAt: response.data.data.userAccount.updatedAt,
      }
    };
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<any>('/auth/register', userData);
    // Backend returns { success: true, data: { userAccount, authToken } }
    // Transform to match frontend interface { token, user }
    return {
      token: response.data.data.authToken,
      user: {
        id: response.data.data.userAccount.userId,
        email: response.data.data.userAccount.email,
        fullName: response.data.data.userAccount.fullName,
        role: response.data.data.userAccount.role,
        profileImage: response.data.data.userAccount.profileImageUrl,
        createdAt: response.data.data.userAccount.createdAt,
        updatedAt: response.data.data.userAccount.updatedAt,
      }
    };
  },

  async logout(): Promise<void> {
    // Clear token from API client
    delete apiClient.defaults.headers.common['Authorization'];
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};
