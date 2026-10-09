export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'UPI' | 'DEBIT_CARD';
export type TableStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
export type ItemStatus = 'PENDING' | 'COOKING' | 'READY';

export interface OrderItemResponse {
  id: number;
  menuItemId: number;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  itemStatus: ItemStatus;
  specialNotes?: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  tableId: number;
  tableNumber: string;
  waiterName?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  totalAmount: number;
  specialInstructions?: string;
  items: OrderItemResponse[];
  createdAt: string;
}

export interface TableResponse {
  id?: number;
  _id?: string;
  tableNumber: string | number;
  capacity?: number;
  qrCodeToken?: string;
  qrToken?: string;
  tableStatus?: TableStatus;
  status?: 'available' | 'occupied' | 'billing' | 'cleaning' | string;
  guestCount?: number;
  activeOrderId?: string;
  orderTotal?: number;
  items?: any[];
  cleaningStartedAt?: string | Date;
}
