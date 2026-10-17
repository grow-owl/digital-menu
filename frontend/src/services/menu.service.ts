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
        const SPECIAL_IMAGE_OVERRIDES: Record<string, string> = {
          // Add-ons & Extras
          'paneer pops': '/images/menu/paneer_pops.jpg',
          'cheesy pizza fingers': '/images/menu/cheesy_pizza_fingers.jpg',
          'nutty taro boba': '/images/menu/nutty_taro_boba.jpg',
          'extra cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80',
          'extra grilled chicken': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
          'ice cream add on': '/images/menu/ice_cream_1scoop.jpg',
          'garlic bread': 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=800&q=80',

          // Artisanal Pastas
          'arrabbiata pasta (veg)': '/images/menu/arrabbiata_pasta_veg.jpg',
          'arrabbiata pasta (chicken)': '/images/menu/arrabbiata_pasta_chicken.jpg',
          'arrabbiata pasta': '/images/menu/arrabbiata_pasta_veg.jpg',

          // Frappes
          'strawberry frappe': '/images/menu/strawberry_frappe.jpg',
          'blueberry frappe': '/images/menu/blueberry_frappe.jpg',
          'mango frappe': '/images/menu/mango_frappe.jpg',
          'biscoff frappe': '/images/menu/biscoff_frappe.jpg',
          'caramel frappe': '/images/menu/caramel_frappe.jpg',
          'coffee mocha frappe': '/images/menu/coffee_mocha_frappe.jpg',
          'oreo frappe': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
          'matcha frappe': 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=800&q=80',

          // Traditional Lassi & Coolers
          'sweet lassi': '/images/menu/sweet_lassi.jpg',
          'strawberry lassi': '/images/menu/strawberry_lassi.jpg',
          'banana lassi': '/images/menu/banana_lassi.jpg',
          'mango lassi': 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=800&q=80',
          'pineapple lassi': 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80',
          'kala khatta': '/images/menu/kala_khatta.jpg',
          'kala khatta mocktail': '/images/menu/kala_khatta.jpg',

          // Milkshakes & Appetisers
          'banana honey cream shake': '/images/menu/banana_honey_shake.jpg',
          'strawberry delight shake': '/images/menu/strawberry_delight_shake.jpg',
          'kitkat crunch shake': '/images/menu/kitkat_crunch_shake.png',
          'blueberry cream shake': '/images/menu/blueberry_cream_shake.png',
          'paneer chilly': '/images/menu/paneer_chilly.jpg',
          'chicken chilly': '/images/menu/chicken_chilli.png',
          'chicken chilli': '/images/menu/chicken_chilli.png',
          'chicken cutlet': '/images/menu/chicken_cutlet.png',
          'chicken pakora': '/images/menu/chicken_pakora.png',
          'chicken wings': '/images/menu/chicken_wings.png',
          'peri peri fries': '/images/menu/peri_peri_fries.png',
          'loaded fries': '/images/menu/loaded_fries.png',
          'potato cheese bites': '/images/menu/potato_cheese_bites.png',

          // Matcha & Boba Series
          'iced matcha latte': '/images/menu/iced_matcha_latte.png',
          'vanilla matcha latte': '/images/menu/vanilla_matcha_latte.png',
          'strawberry matcha latte': '/images/menu/strawberry_matcha_latte.png',
          'mango matcha latte': '/images/menu/mango_matcha_latte.png',
          'matcha boba tea': '/images/menu/matcha_boba_tea.png',
          'coffee mocha boba': '/images/menu/coffee_mocha_boba.png',
          'hazelnut boba': '/images/menu/hazelnut_boba.png',
          'blueberry boba tea': '/images/menu/blueberry_frappe.jpg',

          // Hot Tea & Energy Drinks
          'honey ginger black tea': '/images/menu/honey_ginger_black_tea.png',
          'red bull': '/images/menu/red_bull_energy_drink.png',
          'redbull': '/images/menu/red_bull_energy_drink.png',
        };

        // Ensure accurate, curated images from SILIGURI_MENU_ITEMS and overrides are prioritized
        items = items.map((dbItem) => {
          // If custom uploaded image is present, keep it strictly
          if (dbItem.imageUrl && (dbItem.imageUrl.startsWith('/uploads/') || dbItem.imageUrl.startsWith('data:image/'))) {
            return dbItem;
          }

          if (dbItem.id === 95 || String(dbItem.name || '').toLowerCase().includes('mineral water')) {
            return { ...dbItem, imageUrl: '/images/mineral_water_bottle.jpg' };
          }
          const normName = String(dbItem.name || '').toLowerCase().trim();
          for (const [key, url] of Object.entries(SPECIAL_IMAGE_OVERRIDES)) {
            if (normName.includes(key)) {
              return { ...dbItem, imageUrl: url };
            }
          }
          // Match by id or normalized name
          const localMatch = SILIGURI_MENU_ITEMS.find(
            (local) =>
              local.id === dbItem.id ||
              local.name.toLowerCase().trim() === normName ||
              normName.includes(local.name.toLowerCase().trim()) ||
              local.name.toLowerCase().trim().includes(normName)
          );
          if (localMatch?.imageUrl) {
            return { ...dbItem, imageUrl: localMatch.imageUrl };
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
