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
          if (!tableId || tableId === 'Admin') return;
          const cleanTableNum = String(tableId || '').match(/\d+/)?.[0];
          if (!cleanTableNum) return;
          const res = await apiClient.get(`/tables/table-number/${cleanTableNum}/cart`);
          if (res.data && Array.isArray(res.data.data)) {
            const rawServerItems = res.data.data;
            const validServerItems: CartItem[] = rawServerItems
              .filter((it: any) => it && (it.menuItem || it.menuItemId || it.name))
              .map((it: any) => {
                if (it.menuItem && it.menuItem.price !== undefined) return it;
                return {
                  menuItem: it.menuItem || {
                    id: Number(it.menuItemId) || it.id || 1,
                    name: it.name || 'Dish',
                    price: it.price || it.unitPrice || 0,
                    imageUrl: it.imageUrl || it.image || '',
                    isAvailable: true,
                    categoryId: it.categoryId || 1,
                  },
                  quantity: it.quantity || 1,
                  unitPrice: it.unitPrice ?? it.price ?? 0,
                  specialNotes: it.specialNotes || it.notes || '',
                  addonNames: it.addonNames || [],
                };
              });

            const currentItems = (get().items || []).filter((it) => it && it.menuItem);
            if (validServerItems.length > 0) {
              set({ items: validServerItems, tableId });
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
          if (!tableId || tableId === 'Admin' || tableId === 'null') return;
          const cleanTableNum = String(tableId || '').match(/\d+/)?.[0];
          if (!cleanTableNum) return;
          const sanitized = (items || []).filter((it) => it && it.menuItem);
          await apiClient.put(`/tables/table-number/${cleanTableNum}/cart`, { items: sanitized });
        } catch (e) {
          console.error('Failed to sync cart to server:', e);
        }
      },

      addItem: (menuItem, quantity = 1, specialNotes = '', unitPrice, addonNames) => {
        if (!menuItem || menuItem.isAvailable === false) {
          return;
        }

        set((state) => {
          const validItems = (state.items || []).filter((item) => item && item.menuItem);
          const existingIndex = validItems.findIndex(
            (item) => item.menuItem.id === menuItem.id
          );

          let updatedItems: CartItem[] = [];

          if (existingIndex > -1) {
            updatedItems = [...validItems];
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
              ...validItems,
              { menuItem, quantity, specialNotes, unitPrice, addonNames },
            ];
          }

          if (state.tableId && state.tableId !== 'Admin') {
            get().syncWithServer(state.tableId, updatedItems);
          }

          return { items: updatedItems };
        });
      },

      removeItem: (menuItemId) => {
        set((state) => {
          const updatedItems = (state.items || []).filter(
            (item) => item?.menuItem && item.menuItem.id !== menuItemId
          );

          if (state.tableId && state.tableId !== 'Admin') {
            get().syncWithServer(state.tableId, updatedItems);
          }

          return { items: updatedItems };
        });
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        const existing = (get().items || []).find((it) => it?.menuItem?.id === menuItemId);
        if (existing && existing.menuItem?.isAvailable === false) {
          return;
        }

        set((state) => {
          const updatedItems = (state.items || [])
            .filter((item) => item && item.menuItem)
            .map((item) =>
              item.menuItem.id === menuItemId
                ? { ...item, quantity }
                : item
            );

          if (state.tableId && state.tableId !== 'Admin') {
            get().syncWithServer(state.tableId, updatedItems);
          }

          return { items: updatedItems };
        });
      },

      updateSpecialNotes: (menuItemId, notes) => {
        set((state) => {
          const updatedItems = (state.items || [])
            .filter((item) => item && item.menuItem)
            .map((item) =>
              item.menuItem.id === menuItemId
                ? { ...item, specialNotes: notes }
                : item
            );

          if (state.tableId && state.tableId !== 'Admin') {
            get().syncWithServer(state.tableId, updatedItems);
          }

          return { items: updatedItems };
        });
      },

      updateItemConfiguration: (menuItemId, quantity, unitPrice, specialNotes, addonNames) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((state) => {
          const updatedItems = (state.items || [])
            .filter((item) => item && item.menuItem)
            .map((item) =>
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

          if (state.tableId && state.tableId !== 'Admin') {
            get().syncWithServer(state.tableId, updatedItems);
          }

          return { items: updatedItems };
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
        const items = get().items || [];
        return items.reduce((acc, item) => {
          if (!item) return acc;
          const price = item.unitPrice ?? item.menuItem?.price ?? (item as any).price ?? 0;
          const qty = Number(item.quantity) || 1;
          return acc + (Number(price) * qty);
        }, 0);
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
        const items = get().items || [];
        return items.reduce((acc, item) => {
          if (!item) return acc;
          return acc + (Number(item.quantity) || 0);
        }, 0);
      },
    }),
    {
      name: 'aura_cart_storage',
      partialize: (state) => ({
        items: (state.items || []).filter((item) => item && item.menuItem && item.menuItem.id !== undefined),
        tableId: state.tableId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.items)) {
          state.items = state.items.filter((item: any) => item && item.menuItem && typeof item.menuItem.id !== 'undefined');
        }
      },
    }
  )
);
