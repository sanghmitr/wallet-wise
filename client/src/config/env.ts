const fallbackApiBaseUrl = '/api';

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl,
  appName: 'Wallet Wise',
};
