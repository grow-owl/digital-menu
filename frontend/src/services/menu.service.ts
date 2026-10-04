import { apiClient } from './api-client';
import { ApiResponse, Category, MenuItem } from '../types/menu.types';
import { SILIGURI_CATEGORIES, SILIGURI_MENU_ITEMS } from '../data/siliguriMenuData';

export const ADDONS_CATEGORY: Category = SILIGURI_CATEGORIES.find((c) => c.id === 99) || {
  id: 99,
  name: 'Add-ons & Extras',
  icon: 'PlusCircle',
  iconName: 'PlusCircle',
  displayOrder: 99,
  isActive: true,
};

export const POPULAR_ADDON_ITEMS: MenuItem[] = SILIGURI_MENU_ITEMS.filter((it) => it.categoryId === 99);

export const menuService = {
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
      const cats = response.data.data || [];
      if (cats.length > 0) return cats;
      return SILIGURI_CATEGORIES;
    } catch (e) {
      return SILIGURI_CATEGORIES;
    }
  },

  async createCategory(payload: { name: string; icon?: string; displayOrder?: number }): Promise<Category> {
    const response = await apiClient.post<ApiResponse<Category>>('/categories', payload);
    return response.data.data;
  },

  async updateCategory(id: number, payload: Partial<Category>): Promise<Category> {
    const response = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, payload);
    return response.data.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },

  async getMenuItems(params?: { categoryId?: number; search?: string }): Promise<MenuItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<MenuItem[]>>('/menu-items', { params });
      let items = response.data.data || [];
      if (items.length === 0) {
        items = SILIGURI_MENU_ITEMS;
      } else {
        // Backfill missing imageUrl from local static data so admin-created items
        // without images still display properly on the customer-facing menu
        items = items.map((dbItem) => {
          if (!dbItem.imageUrl || dbItem.imageUrl.trim() === '') {
            // Try matching by id first, then by normalized name
            const localMatch = SILIGURI_MENU_ITEMS.find(
              (local) =>
                local.id === dbItem.id ||
                local.name.toLowerCase().trim() === String(dbItem.name || '').toLowerCase().trim()
            );
            if (localMatch?.imageUrl) {
              return { ...dbItem, imageUrl: localMatch.imageUrl };
            }
            // Category-aware fallback images for common restaurant categories
            const CATEGORY_FALLBACKS: Record<number, string> = {
              1: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80', // Tea/Coffee
              2: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80', // Snacks
              3: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=800&q=80', // Boba/Shakes
              4: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80', // Pasta/Desserts
              5: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80', // Salads
              6: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=800&q=80', // Coolers/Lassi
              7: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', // Burgers
              8: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=800&q=80', // Noodles
            };
            return {
              ...dbItem,
              imageUrl: CATEGORY_FALLBACKS[dbItem.categoryId] ||
                'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
            };
          }
          return dbItem;
        });
      }

      if (params?.categoryId) {
        items = items.filter((it) => it.categoryId === params.categoryId);
      }

      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (it) => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q)
        );
      }

      return items;
    } catch (e) {
      let fallback = SILIGURI_MENU_ITEMS;
      if (params?.categoryId) {
        fallback = fallback.filter((it) => it.categoryId === params.categoryId);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        fallback = fallback.filter(
          (it) => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q)
        );
      }
      return fallback;
    }
  },

  async getMenuItemById(id: number): Promise<MenuItem> {
    try {
      const response = await apiClient.get<ApiResponse<MenuItem>>(`/menu-items/${id}`);
      if (response.data.data) return response.data.data;
    } catch (e) {
      // fallback
    }
    const found = SILIGURI_MENU_ITEMS.find((it) => it.id === id);
    if (found) return found;
    return SILIGURI_MENU_ITEMS[0];
  },

  async createMenuItem(payload: Partial<MenuItem>): Promise<MenuItem> {
    const response = await apiClient.post<ApiResponse<MenuItem>>('/menu-items', payload);
    return response.data.data;
  },

  async updateMenuItem(id: number, payload: Partial<MenuItem>): Promise<MenuItem> {
    const response = await apiClient.put<ApiResponse<MenuItem>>(`/menu-items/${id}`, payload);
    return response.data.data;
  },

  async deleteMenuItem(id: number): Promise<void> {
    await apiClient.delete(`/menu-items/${id}`);
  }
};
