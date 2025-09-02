import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import RootProvider from '@/RootProvider';
import App from './App';
import './globals.scss';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <FluentProvider theme={webLightTheme} applyStylesToPortals>
    <QueryClientProvider client={queryClient}>
      <RootProvider
        services={
          {
            // Override services here if needed
          }
        }
      >
        <div className="app-root">
          <App />
        </div>
      </RootProvider>
    </QueryClientProvider>
  </FluentProvider>
);
