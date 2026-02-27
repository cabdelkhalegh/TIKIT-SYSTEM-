import { apiClient } from '@/lib/api-client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterStep1Response,
  RegisterStep2Response,
  RegisterStep3Response,
  RegisterResponse,
  User,
} from '@/types/auth.types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    const body = response.data;
    const account = body.data?.userAccount || body.data?.user || body.user || {};
    return {
      token: body.data?.authToken || body.data?.accessToken || body.token,
      user: { ...account, id: account.userId || account.id },
      remainingAttempts: body.data?.remainingAttempts ?? body.remainingAttempts,
      lockedUntil: body.data?.lockedUntil ?? body.lockedUntil,
    };
  },

  // Legacy single-step register (compat)
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post('/auth/register', userData);
    const body = response.data;
    const account = body.data?.userAccount || body.user || {};
    return {
      token: body.data?.authToken || body.data?.token || body.token,
      user: { ...account, id: account.userId || account.id },
    };
  },

  // V2 Multi-step registration
  async registerStep1(data: RegisterRequest): Promise<RegisterStep1Response> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async registerStep2(licenseFileUrl: string, token: string): Promise<RegisterStep2Response> {
    const response = await apiClient.post(
      '/auth/register/step-2',
      { licenseFileUrl },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async registerStep3(
    data: {
      companyName?: string;
      vatTrnNumber?: string;
      licenseNumber?: string;
      expiryDate?: string;
      businessAddress?: string;
      activities?: string[];
      ownerNames?: string[];
    },
    token: string
  ): Promise<RegisterStep3Response> {
    const response = await apiClient.post('/auth/register/step-3', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async registerSubmit(token: string): Promise<{ success: boolean; data: { status: string; message: string } }> {
    const response = await apiClient.post(
      '/auth/register/submit',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Logout is best-effort
    }
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

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },
};
