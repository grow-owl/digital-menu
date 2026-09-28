export interface VenueQrConfig {
  brandName: string;
  baseUrl: string;
  tagline: string;
  urlFormat: '/dine/' | '/t/';
  showWifi: boolean;
  wifiSsid: string;
  wifiPassword: string;
  themeStyle: 'EMERALD_GOLD' | 'ROYAL_NOIR' | 'MINIMAL_IVORY' | 'SUNSET_AMBER' | 'CYBER_NEON';
  badgeText: string;
  centerIcon?: 'CUTLERY' | 'WINE' | 'SPARKLES' | 'CHEF' | 'TEXT';
  cardLayout?: 'STAND_4X6' | 'BOARD_POSTER' | 'STICKER_SQUARE' | 'RAW_QR';
  customNote?: string;
}

export const STORAGE_KEY_VENUE_CONFIG = 'aura_venue_qr_settings';
export const EVENT_VENUE_CONFIG_UPDATED = 'aura_venue_config_updated';

export const DEFAULT_VENUE_CONFIG: VenueQrConfig = {
  brandName: "Siliguri's Chai Addaa",
  baseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://siligurichaiaddaa.com',
  tagline: 'Good Food • Better Chai • Happier People',
  urlFormat: '/dine/',
  showWifi: true,
  wifiSsid: 'SiliguriChaiAddaa-5G',
  wifiPassword: 'ChaiAddaa2021',
  themeStyle: 'EMERALD_GOLD',
  badgeText: 'Chai • Food • People • Stories • Est. 2021',
  centerIcon: 'CUTLERY',
  cardLayout: 'STAND_4X6',
  customNote: 'Siliguri Chai Addaa Digital Ordering System',
};

/**
 * Retrieves the persisted venue & QR domain configuration.
 * Falls back to sensible defaults and current window.location.origin.
 */
export const getVenueConfig = (): VenueQrConfig => {
  if (typeof window === 'undefined') return DEFAULT_VENUE_CONFIG;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_VENUE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_VENUE_CONFIG,
        ...parsed,
        // If baseUrl is empty, fallback to current origin
        baseUrl: parsed.baseUrl?.trim() ? parsed.baseUrl.trim().replace(/\/+$/, '') : window.location.origin,
      };
    }
  } catch (err) {
    console.error('Failed to parse venue QR configuration:', err);
  }

  return {
    ...DEFAULT_VENUE_CONFIG,
    baseUrl: window.location.origin,
  };
};

/**
 * Persists the venue & QR domain configuration and broadcasts an update event.
 */
export const saveVenueConfig = (config: Partial<VenueQrConfig>): VenueQrConfig => {
  const current = getVenueConfig();
  const updated: VenueQrConfig = {
    ...current,
    ...config,
    // Sanitize base URL: remove trailing slash
    baseUrl: config.baseUrl ? config.baseUrl.trim().replace(/\/+$/, '') : current.baseUrl,
  };

  try {
    localStorage.setItem(STORAGE_KEY_VENUE_CONFIG, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_VENUE_CONFIG_UPDATED, { detail: updated }));
  } catch (err) {
    console.error('Failed to save venue QR configuration:', err);
  }

  return updated;
};

/**
 * Computes the target customer dining URL for a specific table token.
 */
export const computeTableDineUrl = (token?: string, customConfig?: VenueQrConfig): string => {
  const cfg = customConfig || getVenueConfig();
  const cleanBase = (cfg.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  const format = cfg.urlFormat || '/dine/';
  const cleanToken = token || 'demo-token';
  return `${cleanBase}${format}${cleanToken}`;
};
