// T058: Admin service for registration approval and user management
import { apiClient } from '@/lib/api-client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RegistrationUser {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  createdAt: string;
}

export interface Registration {
  id: string;
  user: RegistrationUser;
  companyName: string | null;
  vatTrnNumber: string | null;
  licenseNumber: string | null;
  expiryDate: string | null;
  businessAddress: string | null;
  activities: string[];
  ownerNames: string[];
  licenseFileUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  roles: string[];
  lastSignIn: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    registrations?: T[];
    users?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ─── Service ────────────────────────────────────────────────────────────────

export const adminService = {
  // Registration management
  async getRegistrations(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<Registration>> {
    const response = await apiClient.get('/admin/registrations', { params });
    return response.data;
  },

  async approveRegistration(
    registrationId: string,
    role: string = 'client'
  ): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post(
      `/admin/registrations/${registrationId}/approve`,
      { role }
    );
    return response.data;
  },

  async rejectRegistration(
    registrationId: string,
    reason: string
  ): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post(
      `/admin/registrations/${registrationId}/reject`,
      { reason }
    );
    return response.data;
  },

  // User management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<AdminUser>> {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  async updateUserRoles(
    userId: string,
    roles: { add?: string[]; remove?: string[] }
  ): Promise<{ success: boolean; data: { userId: string; roles: string[]; message: string } }> {
    const response = await apiClient.patch(`/admin/users/${userId}/roles`, roles);
    return response.data;
  },

  async resetPassword(
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; data: { userId: string; message: string } }> {
    const response = await apiClient.post(`/admin/users/${userId}/reset-password`, {
      newPassword,
    });
    return response.data;
  },

  async sendResetEmail(
    userId: string
  ): Promise<{ success: boolean; data: { userId: string; email: string; message: string } }> {
    const response = await apiClient.post(`/admin/users/${userId}/send-reset-email`, {});
    return response.data;
  },

  async unlockAccount(
    userId: string
  ): Promise<{ success: boolean; data: { userId: string; message: string } }> {
    const response = await apiClient.post(`/admin/users/${userId}/unlock`, {});
    return response.data;
  },

  async deleteUser(
    userId: string
  ): Promise<{ success: boolean; data: { userId: string; message: string } }> {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },
};
