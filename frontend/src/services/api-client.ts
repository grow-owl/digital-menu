import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/use-auth-store';

const getApiBaseUrl = () => {
  const metaEnv = (import.meta as any).env || {};
  if (metaEnv.VITE_API_URL) {
    return metaEnv.VITE_API_URL;
  }
  if (metaEnv.VITE_API_BASE_URL) {
    return metaEnv.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Localhost or 127.0.0.1 development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // LAN IP testing (e.g. 192.168.x.x)
    if (/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
      return `http://${hostname}:5000/api`;
    }
    // Vercel / Production deployment: use relative /api path
    return '/api';
  }
  return '/api';
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Inject staff secret for kitchen/waiter tablet operations (cancel, pay-table)
    const staffSecret = (import.meta as any).env?.VITE_STAFF_SECRET;
    if (staffSecret && config.headers) {
      config.headers['x-staff-secret'] = staffSecret;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency queue handling for seamless token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If this was already a refresh request that failed, logout immediately
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${getApiBaseUrl()}/auth/refresh-token`, {
          refreshToken,
        });

        const data = response.data?.data;
        const newAccessToken = data?.accessToken || data?.token;
        const newRefreshToken = data?.refreshToken;

        if (!newAccessToken) {
          throw new Error('Failed to obtain new access token');
        }

        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

