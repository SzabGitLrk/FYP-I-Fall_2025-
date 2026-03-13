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
    const status: number | undefined = error.response?.status;
    const rawData: unknown = error.response?.data;

    if (!error.response) {
      return Promise.reject(
        new Error(
          'Unable to reach the server. Please make sure the backend is running and try again.',
        ),
      );
    }

    // Vite proxy returns 502/503/504 with a string/HTML body when backend is down.
    if (status && [502, 503, 504].includes(status)) {
      return Promise.reject(
        new Error(
          'Unable to reach the server. Please make sure the backend is running and try again.',
        ),
      );
    }

    let errorMessage = 'An error occurred. Please try again.';

    // Handle string bodies (HTML, proxy errors, etc).
    if (typeof rawData === 'string') {
      const text = rawData.trim();

      // Try parse JSON string bodies.
      if (text.startsWith('{') || text.startsWith('[')) {
        try {
          const parsed = JSON.parse(text) as unknown;
          if (parsed && typeof parsed === 'object') {
            const data = parsed as { message?: string | string[]; error?: string };
            if (typeof data.message === 'string' && data.message.trim()) {
              errorMessage = data.message;
            } else if (Array.isArray(data.message) && data.message.length > 0) {
              errorMessage = data.message.join(' ');
            } else if (typeof data.error === 'string' && data.error.trim()) {
              errorMessage = data.error;
            }
          }
        } catch {
          // Fall through to text heuristics.
        }
      }

      // Common proxy/backend-down strings.
      if (
        errorMessage === 'An error occurred. Please try again.' &&
        /ECONNREFUSED|EHOSTUNREACH|ENOTFOUND|EAI_AGAIN|socket hang up|connect\s+ECONNREFUSED/i.test(
          text,
        )
      ) {
        errorMessage =
          'Unable to reach the server. Please make sure the backend is running and try again.';
      }

      // Express-style 404 plain text: "Cannot POST /route"
      if (errorMessage === 'An error occurred. Please try again.') {
        const cannotMatch = text.match(
          /Cannot\s+(?:GET|POST|PUT|PATCH|DELETE)\s+\/[^\s<]*/i,
        );
        if (cannotMatch?.[0]) {
          errorMessage = cannotMatch[0];
        }
      }
    } else if (rawData && typeof rawData === 'object') {
      const data = rawData as { message?: string | string[]; error?: string };
      if (typeof data.message === 'string' && data.message.trim()) {
        errorMessage = data.message;
      } else if (Array.isArray(data.message) && data.message.length > 0) {
        errorMessage = data.message.join(' ');
      } else if (typeof data.error === 'string' && data.error.trim()) {
        errorMessage = data.error;
      }
    }

    return Promise.reject(new Error(errorMessage));
  },
);

export default apiClient;
