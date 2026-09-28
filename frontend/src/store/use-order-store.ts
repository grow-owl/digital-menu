import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrderState {
  activeOrderId: string | null;
  setActiveOrderId: (orderId: string | null) => void;
  clearActiveOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      activeOrderId: null,
      setActiveOrderId: (orderId) => set({ activeOrderId: orderId }),
      clearActiveOrder: () => set({ activeOrderId: null }),
    }),
    {
      name: 'aura-active-order',
    }
  )
);
