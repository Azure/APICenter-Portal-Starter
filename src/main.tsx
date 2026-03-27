import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { useRecoilValue } from 'recoil';
import RootProvider from '@/RootProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import { isDarkModeAtom } from '@/atoms/isDarkModeAtom';
import App from './App';
import './globals.scss';

const queryClient = new QueryClient();

const ThemedApp: React.FC = () => {
  const isDarkMode = useRecoilValue(isDarkModeAtom);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme} applyStylesToPortals>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <div className="app-root">
            <App />
          </div>
        </QueryClientProvider>
      </ErrorBoundary>
    </FluentProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RootProvider
    services={
      {
        // Override services here if needed
      }
    }
  >
    <ThemedApp />
  </RootProvider>
);
