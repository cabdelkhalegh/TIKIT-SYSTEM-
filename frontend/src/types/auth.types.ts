export interface User {
  id: string;
  email: string;
  fullName: string;
  displayName?: string;
  role: string;
  roles?: string[];
  profileImage?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  remainingAttempts?: number;
  lockedUntil?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RegisterStep1Response {
  success: boolean;
  data: {
    id: string;
    email: string;
    displayName: string;
    isActive: boolean;
    registration: {
      id: string;
      status: string;
    };
    token: string;
  };
}

export interface RegisterStep2Response {
  success: boolean;
  data: {
    registrationId: string;
    extraction: {
      companyName: string | null;
      vatTrnNumber: string | null;
      licenseNumber: string | null;
      expiryDate: string | null;
      businessAddress: string | null;
      activities: string[];
      ownerNames: string[];
      confidenceScores?: Record<string, number>;
    } | null;
    extractionSuccess: boolean;
    fallbackRequired: boolean;
    confidenceScores: Record<string, number> | null;
  };
}

export interface RegisterStep3Response {
  success: boolean;
  data: {
    id: string;
    companyName: string | null;
    vatTrnNumber: string | null;
    licenseNumber: string | null;
    expiryDate: string | null;
    businessAddress: string | null;
    activities: string[];
    ownerNames: string[];
    licenseFileUrl: string | null;
    status: string;
  };
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  initialize: () => void;
}
