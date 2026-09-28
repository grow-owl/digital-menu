import { apiClient } from './api-client';
import { MenuItem } from '../types/menu.types';

export const contentService = {
  getFaqs: async () => {
    const res = await apiClient.get('/content/faqs');
    return res.data.data;
  },
  getGallery: async () => {
    const res = await apiClient.get('/content/gallery');
    return res.data.data;
  },
  createReservation: async (data: any) => {
    const res = await apiClient.post('/content/reservations', data);
    return res.data.data;
  },
  getWishlist: async (userId: string) => {
    const res = await apiClient.get(`/content/users/${userId}/wishlist`);
    return res.data.data as MenuItem[];
  },
  toggleWishlist: async (userId: string, itemId: number) => {
    const res = await apiClient.post(`/content/users/${userId}/wishlist/toggle`, { itemId });
    return res.data.data as MenuItem[];
  }
};
