import { apiClient } from './api-client';
import { CartItem } from '../types/menu.types';

export interface OrderPayload {
  tableId: string;
  customerPhone?: string;
  customerName?: string;
  items: {
    menuItemId: number;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
  sessionId?: string;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  pointsEarned?: number;
}

export const orderService = {
  async placeOrder(payload: OrderPayload) {
    const response = await apiClient.post('/orders', payload);
    return response.data.data;
  },

  async getOrder(orderId: string) {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data.data;
  },

  async getOrdersByPhone(phone: string) {
    const response = await apiClient.get(`/orders/phone/${phone}`);
    return response.data.data;
  },

  async getOrdersByTable(tableId: string) {
    const response = await apiClient.get(`/orders/table/${tableId}`);
    return response.data.data;
  },

  async getActiveOrders() {
    const response = await apiClient.get('/orders/active/all');
    return response.data.data;
  },

  async updateOrderStatus(orderId: string, status: string) {
    const response = await apiClient.put(`/orders/${orderId}/status`, { status });
    return response.data.data;
  },

  async checkOrderItem(orderId: string, itemIndex: number, isPrepared: boolean) {
    const response = await apiClient.put(`/orders/${orderId}/items/check`, { itemIndex, isPrepared });
    return response.data;
  },

  async cancelOrderItem(orderId: string, itemIndex: number, reason?: string, cancelledBy?: string) {
    const response = await apiClient.put(`/orders/${orderId}/items/${itemIndex}/cancel`, { reason, cancelledBy });
    return response.data;
  },

  async cancelOrder(orderId: string, reason?: string, cancelledBy?: string) {
    const response = await apiClient.put(`/orders/${orderId}/cancel`, { reason, cancelledBy });
    return response.data;
  },

  async payTableBill(tableId: string | number, paymentMethod: string = 'UPI_QR') {
    const response = await apiClient.post('/orders/pay-table', { tableId: String(tableId), paymentMethod });
    return response.data;
  },

  async settleTableBill(tableId: string | number, paymentMethod: string = 'UPI_QR') {
    const response = await apiClient.post('/orders/pay-table', { tableId: String(tableId), paymentMethod });
    return response.data;
  },

  async getSettledOrders() {
    const response = await apiClient.get('/orders/settled/all');
    return response.data.data;
  },

  async refundOrder(orderId: string, payload?: string | {
    amount?: number;
    reason?: string;
    refundedBy?: string;
    refundType?: 'FULL' | 'PARTIAL';
    refundedItems?: any[];
    refundMethod?: string;
  }) {
    const body = typeof payload === 'string' ? { reason: payload } : (payload || {});
    const response = await apiClient.post(`/orders/${orderId}/refund`, body);
    return response.data;
  },

  async getRefundedOrders() {
    const response = await apiClient.get('/orders/refunds/all');
    return response.data.data;
  }
};
