import { apiClient } from './api-client';

export interface TierMeta {
  name: string;
  color: string;
  multiplier: number;
  nextTier: string | null;
  pointsNeeded: number;
  progressPct: number;
  perks: string[];
}

export interface LoyaltyTransaction {
  _id: string;
  userId?: string;
  customerPhone: string;
  orderId?: string;
  type: 
    | 'WELCOME_BONUS'
    | 'EARNED_DINING'
    | 'EARNED_FEEDBACK'
    | 'REDEEMED_ORDER'
    | 'REFUND_DEDUCTION'
    | 'ORDER_CANCEL_RESTORE'
    | 'ADMIN_ADJUSTMENT';
  points: number;
  balanceAfter: number;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface LoyaltyBalanceResponse {
  userId?: string;
  name?: string;
  phone: string;
  isRegistered: boolean;
  loyaltyPoints: number;
  lifetimePoints: number;
  loyaltyTier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM' | string;
  cashValue: number;
  tierMeta: TierMeta;
  recentTransactions: LoyaltyTransaction[];
}

export const loyaltyService = {
  // Fetch live loyalty wallet balance and tier details
  async getLoyaltyBalance(phone: string): Promise<LoyaltyBalanceResponse> {
    const encodedPhone = encodeURIComponent(phone);
    const response = await apiClient.get(`/loyalty/balance/${encodedPhone}`);
    return response.data.data;
  },

  // Fetch full points transaction history
  async getTransactions(phone: string, limit = 50): Promise<LoyaltyTransaction[]> {
    const encodedPhone = encodeURIComponent(phone);
    const response = await apiClient.get(`/loyalty/transactions/${encodedPhone}?limit=${limit}`);
    return response.data.data;
  },

  // Claim feedback bonus (+50 points)
  async claimFeedbackBonus(data: {
    phone: string;
    orderId?: string;
    rating?: number;
    feedback?: string;
  }) {
    const response = await apiClient.post('/loyalty/feedback-reward', data);
    return response.data;
  },

  // Cashier / Admin manual adjustment
  async adjustPoints(data: {
    phone: string;
    points: number;
    reason: string;
    adjustedBy?: string;
  }) {
    const response = await apiClient.post('/loyalty/admin/adjust', data);
    return response.data;
  }
};
