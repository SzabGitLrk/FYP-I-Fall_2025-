import axios from 'axios';

const getToken = () => localStorage.getItem('token');
const getLanguage = () => localStorage.getItem('appLanguage');

const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const apiClient = axios.create({
  baseURL:
    import.meta.env.MODE === 'production'
      ? import.meta.env.VITE_API_URL
      : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const isPublicRoute = publicRoutes.includes(config.url || '');
    const language = getLanguage();

    if (config.headers) {
      config.headers['Accept-Language'] = language;
    }

    if (!isPublicRoute) {
      const token = getToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error(
          'Unable to reach the server. Please make sure the backend is running and try again.',
        ),
      );
    }

    const status: number | undefined = error.response.status;
    const data = error.response.data as { error?: string } | string | undefined;

    if (status && [500, 502, 503, 504].includes(status)) {
      return Promise.reject(
        new Error(
          'Unable to reach the server. Please make sure the backend is running and try again.',
        ),
      );
    }

    const errorMessage =
      typeof data === 'object' && data
        ? data.error || 'An error occurred. Please try again.'
        : 'An error occurred. Please try again.';

    return Promise.reject(new Error(errorMessage));
  },
);

export default apiClient;
