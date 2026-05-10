import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://rally-production-2004.up.railway.app/api/';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('hivago_access_token');
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
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
    if (error?.response?.status === 401) {
      console.warn('[Auth] Unauthorized access detected, triggering logout...');
      window.dispatchEvent(new CustomEvent('hivago-unauthorized'));
    }
    return Promise.reject(error?.response?.data || error);
  }
);

export default client;
