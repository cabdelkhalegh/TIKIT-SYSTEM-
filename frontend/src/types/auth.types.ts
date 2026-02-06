export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'client_manager' | 'influencer_manager';
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'client_manager' | 'influencer_manager';
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
