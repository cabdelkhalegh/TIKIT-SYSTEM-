import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@/types/auth.types';

// Helper function to transform backend user account to frontend user type
const transformUserAccount = (userAccount: any) => ({
  id: userAccount.userId,
  email: userAccount.email,
  fullName: userAccount.fullName,
  role: userAccount.role,
  profileImage: userAccount.profileImageUrl,
  createdAt: userAccount.createdAt,
  updatedAt: userAccount.updatedAt,
});

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    // Backend returns {success, data: {authToken, userAccount}}
    // Transform to match LoginResponse {token, user}
    return {
      token: response.data.data.authToken,
      user: transformUserAccount(response.data.data.userAccount),
    };
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post('/auth/register', userData);
    // Backend returns {success, data: {authToken, userAccount}}
    // Transform to match RegisterResponse {token, user}
    return {
      token: response.data.data.authToken,
      user: transformUserAccount(response.data.data.userAccount),
    };
  },

  async logout(): Promise<void> {
    // Clear token from API client
    delete apiClient.defaults.headers.common['Authorization'];
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/auth/profile');
    return transformUserAccount(response.data.data.userAccount);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put('/auth/profile', data);
    return transformUserAccount(response.data.data.userAccount);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};
