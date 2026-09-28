import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '../types/menu.types';
import { apiClient } from '../services/api-client';

interface CartState {
  items: CartItem[];
  tableId: string | null;
  setTableId: (tableId: string) => void;
  fetchServerCart: (tableId: string, force?: boolean) => Promise<void>;
  syncWithServer: (tableId: string, items: CartItem[]) => Promise<void>;
  addItem: (
    menuItem: MenuItem,
    quantity?: number,
    specialNotes?: string,
    unitPrice?: number,
    addonNames?: string[]
  ) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  updateSpecialNotes: (menuItemId: number, notes: string) => void;
  updateItemConfiguration: (
    menuItemId: number,
    quantity: number,
    unitPrice?: number,
    specialNotes?: string,
    addonNames?: string[]
  ) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getServiceCharge: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,

      setTableId: (tableId: string) => {
        const currentTableId = get().tableId;
        set({ tableId });
        const isDifferentTable = currentTableId !== null && currentTableId !== tableId;
        get().fetchServerCart(tableId, isDifferentTable);
      },

      fetchServerCart: async (tableId: string, force = false) => {
        try {
          const cleanTableNum = String(tableId || '').match(/\d+/)?.[0] || '1';
          const res = await apiClient.get(`/tables/table-number/${cleanTableNum}/cart`);
          if (res.data && Array.isArray(res.data.data)) {
            const serverItems = res.data.data;
            const currentItems = get().items;
            if (serverItems.length > 0) {
              set({ items: serverItems, tableId });
            } else if (currentItems.length > 0 && !force) {
              // Local cart has items, server is empty: preserve local items & sync to server
              get().syncWithServer(tableId, currentItems);
              set({ tableId });
            } else {
              set({ items: [], tableId });
            }
          }
        } catch (e) {
          // Gracefully fallback to local state if server table session is initializing
        }
      },

      syncWithServer: async (tableId: string, items: CartItem[]) => {
        try {
          const cleanTableNum = String(tableId || '').match(/\d+/)?.[0] || '1';
          await apiClient.put(`/tables/table-number/${cleanTableNum}/cart`, { items });
        } catch (e) {
          console.error('Failed to sync cart to server:', e);
        }
      },

      addItem: (menuItem, quantity = 1, specialNotes = '', unitPrice, addonNames) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.menuItem.id === menuItem.id
          );

          let updatedItems: CartItem[] = [];

          if (existingIndex > -1) {
            updatedItems = [...state.items];
            const existingItem = updatedItems[existingIndex];
            updatedItems[existingIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + quantity,
              specialNotes: specialNotes || existingItem.specialNotes,
              unitPrice: unitPrice ?? existingItem.unitPrice,
              addonNames: addonNames ?? existingItem.addonNames,
            };
          } else {
            updatedItems = [
              ...state.items,
              { menuItem, quantity, specialNotes, unitPrice, addonNames },
            ];
          }

          const targetTableId = state.tableId || '10';
          get().syncWithServer(targetTableId, updatedItems);

          return { items: updatedItems, tableId: targetTableId };
        });
      },

      removeItem: (menuItemId) => {
        set((state) => {
          const updatedItems = state.items.filter(
            (item) => item.menuItem.id !== menuItemId
          );

          const targetTableId = state.tableId || '10';
          get().syncWithServer(targetTableId, updatedItems);

          return { items: updatedItems, tableId: targetTableId };
        });
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === menuItemId
              ? { ...item, quantity }
              : item
          );

          const targetTableId = state.tableId || '10';
          get().syncWithServer(targetTableId, updatedItems);

          return { items: updatedItems, tableId: targetTableId };
        });
      },

      updateSpecialNotes: (menuItemId, notes) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === menuItemId
              ? { ...item, specialNotes: notes }
              : item
          );

          const targetTableId = state.tableId || '10';
          get().syncWithServer(targetTableId, updatedItems);

          return { items: updatedItems, tableId: targetTableId };
        });
      },

      updateItemConfiguration: (menuItemId, quantity, unitPrice, specialNotes, addonNames) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === menuItemId
              ? {
                  ...item,
                  quantity,
                  unitPrice: unitPrice ?? item.unitPrice,
                  specialNotes: specialNotes ?? item.specialNotes,
                  addonNames: addonNames ?? item.addonNames,
                }
              : item
          );

          const targetTableId = state.tableId || '10';
          get().syncWithServer(targetTableId, updatedItems);

          return { items: updatedItems, tableId: targetTableId };
        });
      },

      clearCart: () => {
        const tableId = get().tableId;
        set({ items: [] });
        if (tableId) {
          get().syncWithServer(tableId, []);
        }
      },

      getSubtotal: () => {
        return get().items.reduce(
          (acc, item) => acc + (item.unitPrice ?? item.menuItem.price) * item.quantity,
          0
        );
      },

      getTaxAmount: () => {
        // 5% GST on Subtotal
        return get().getSubtotal() * 0.05;
      },

      getServiceCharge: () => {
        // Optional 5% service charge
        return get().getSubtotal() * 0.05;
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const gst = get().getTaxAmount();
        return subtotal + gst;
      },

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: 'aura_cart_storage',
      partialize: (state) => ({
        items: state.items,
        tableId: state.tableId,
      }),
    }
  )
);
