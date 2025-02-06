import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import RootProvider from '@/RootProvider';
import App from './App';
import './globals.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme} className="app-root">
      <RootProvider
        services={
          {
            // Override services here if needed
          }
        }
      >
        <App />
      </RootProvider>
    </FluentProvider>
  </React.StrictMode>
);
