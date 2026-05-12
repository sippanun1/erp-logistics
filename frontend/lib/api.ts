import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Guard flag — prevents an infinite refresh loop when the refresh token
// itself is expired (401 → refresh → 401 → refresh → ...).
let isRefreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      // If we're already mid-refresh, don't try again — just send to login
      if (isRefreshing) {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      original._retry = true;
      const refreshToken = Cookies.get('refresh_token');

      if (refreshToken) {
        isRefreshing = true;
        try {
          const { data } = await axios.post(
            '/api/auth/refresh',
            { refreshToken },
            { headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } },
          );
          Cookies.set('access_token', data.data.accessToken, { secure: true, sameSite: 'strict' });
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
