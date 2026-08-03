import axios from 'axios';

const rawUrl = (import.meta.env.VITE_API_URL || 'https://rally-production-2004.up.railway.app').replace(/\/+$/, '');
const API_BASE_URL = rawUrl.endsWith('/api') ? `${rawUrl}/` : `${rawUrl}/api/`;


const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('hivago_access_token') || sessionStorage.getItem('hivago_access_token');
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Prevent aggressive browser/proxy caching by appending a timestamp to GET requests
  if (config.method?.toUpperCase() === 'GET') {
    config.params = {
      ...config.params,
      _ts: Date.now()
    };
  }

  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params ?? '');
  return config;
});

client.interceptors.response.use(
  response => {
    console.log(`[API Success] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  error => {
    console.error(`[API Error] ${error?.response?.status} ${error?.config?.url}`, error?.response?.data || error.message);
    if (error?.response?.status === 401 && error?.response?.data?.error !== 'Order.Unauthorized') {
      console.warn('[Auth] Unauthorized access detected, triggering logout...');
      window.dispatchEvent(new CustomEvent('hivago-unauthorized'));
    }
    return Promise.reject(error?.response?.data || error);
  }
);

export default client;
