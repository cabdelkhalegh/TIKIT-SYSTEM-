import { apiClient } from '@/lib/api-client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@/types/auth.types';

// Backend response structure
interface BackendAuthResponse {
  success: boolean;
  data: {
    userAccount: {
      userId: string;
      email: string;
      fullName: string;
      role: 'admin' | 'client_manager' | 'influencer_manager';
      profileImageUrl: string | null;
      createdAt: string;
      updatedAt: string;
    };
    authToken: string;
  };
}

// Transform backend response to frontend format
function transformAuthResponse(backendResponse: BackendAuthResponse): LoginResponse {
  return {
    token: backendResponse.data.authToken,
    user: {
      id: backendResponse.data.userAccount.userId,
      email: backendResponse.data.userAccount.email,
      fullName: backendResponse.data.userAccount.fullName,
      role: backendResponse.data.userAccount.role,
      profileImage: backendResponse.data.userAccount.profileImageUrl ?? undefined,
      createdAt: backendResponse.data.userAccount.createdAt,
      updatedAt: backendResponse.data.userAccount.updatedAt,
    }
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<BackendAuthResponse>('/auth/login', credentials);
    return transformAuthResponse(response.data);
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<BackendAuthResponse>('/auth/register', userData);
    return transformAuthResponse(response.data);
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
