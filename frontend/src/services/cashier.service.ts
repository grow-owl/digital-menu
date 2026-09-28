import { apiClient } from './api-client';
import { ApiResponse } from '../types/user.types';
import { OrderResponse, PaymentMethod } from '../types/order.types';

export interface PaymentResponse {
  orderId: number;
  orderNumber: string;
  tableNumber: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  settledAt: string;
}

export const cashierService = {
  async getPendingBills(): Promise<OrderResponse[]> {
    const response = await apiClient.get<ApiResponse<OrderResponse[]>>('/cashier/pending-bills');
    return response.data.data;
  },

  async settlePayment(orderId: number, paymentMethod: PaymentMethod): Promise<PaymentResponse> {
    const response = await apiClient.post<ApiResponse<PaymentResponse>>('/cashier/settle', {
      orderId,
      paymentMethod,
    });
    return response.data.data;
  },
};
