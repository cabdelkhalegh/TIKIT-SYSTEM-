import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@/types/auth.types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    // Backend returns {success, data: {authToken, userAccount}}
    // Transform to match LoginResponse {token, user}
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
      },
    };
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post('/auth/register', userData);
    // Backend returns {success, data: {authToken, userAccount}}
    // Transform to match RegisterResponse {token, user}
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
      },
    };
  },

  async logout(): Promise<void> {
    // Clear token from API client
    delete apiClient.defaults.headers.common['Authorization'];
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/auth/profile');
    const userData = response.data.data.userAccount;
    return {
      id: userData.userId,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      profileImage: userData.profileImageUrl,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put('/auth/profile', data);
    const userData = response.data.data.userAccount;
    return {
      id: userData.userId,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      profileImage: userData.profileImageUrl,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};
