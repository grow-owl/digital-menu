import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from '../types/menu.types';

interface WishlistState {
  wishlist: MenuItem[];
  toggleWishlist: (item: MenuItem) => boolean; // returns true if added, false if removed
  isWishlisted: (itemId: number) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      toggleWishlist: (item: MenuItem) => {
        const exists = get().wishlist.some((it) => it.id === item.id);
        if (exists) {
          set({ wishlist: get().wishlist.filter((it) => it.id !== item.id) });
          return false;
        } else {
          set({ wishlist: [...get().wishlist, item] });
          return true;
        }
      },
      isWishlisted: (itemId: number) => {
        return get().wishlist.some((it) => it.id === itemId);
      },
      clearWishlist: () => set({ wishlist: [] }),
    }),
    {
      name: 'aura-wishlist-storage',
    }
  )
);
