import { apiClient } from './api-client';
import { Coupon } from '../types/menu.types';

export const couponService = {
  async validateCoupon(code: string): Promise<Coupon> {
    const response = await apiClient.get(`/coupons/validate/${code}`);
    return response.data.data;
  },
  async getAllCoupons(): Promise<Coupon[]> {
    const response = await apiClient.get(`/coupons`);
    return response.data.data;
  }
};
