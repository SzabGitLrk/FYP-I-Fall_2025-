import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import theme from './theme/theme';
import i18n from './config/i18n';
import { LanguageProvider } from './context/LanguageContext';
import { SnackbarProvider } from 'notistack';

const queryClient = new QueryClient();

const rootElement = document.getElementById('root') as HTMLElement;
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider maxSnack={3}>
            <LanguageProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </LanguageProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
