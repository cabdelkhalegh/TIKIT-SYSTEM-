import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@/types/auth.types';

// Helper to map backend user object to frontend User type
function mapUser(userAccount: Record<string, any>): User {
  return {
    id: userAccount.userId,
    email: userAccount.email,
    fullName: userAccount.fullName,
    role: userAccount.role,
    profileImage: userAccount.profileImageUrl,
    createdAt: userAccount.createdAt,
    updatedAt: userAccount.updatedAt || userAccount.createdAt,
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    const { authToken, userAccount } = response.data.data;
    return {
      token: authToken,
      user: mapUser(userAccount),
    };
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post('/auth/register', userData);
    const { authToken, userAccount } = response.data.data;
    return {
      token: authToken,
      user: mapUser(userAccount),
    };
  },

  async logout(): Promise<void> {
    // Clear token from API client
    delete apiClient.defaults.headers.common['Authorization'];
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/auth/profile');
    return mapUser(response.data.data || response.data);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put('/auth/profile', data);
    return mapUser(response.data.data || response.data);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};
