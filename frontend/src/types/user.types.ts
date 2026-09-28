export type Role =
  | 'OWNER'
  | 'CASHIER'
  | 'CHEF'
  | 'WAITER'
  | 'CUSTOMER';

export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  status?: string;
  role?: Role;
  isActive?: boolean;
  loyaltyPoints?: number;
  lifetimePoints?: number;
  loyaltyTier?: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM' | string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
  traceId: string;
}
