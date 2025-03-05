import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import RootProvider from '@/RootProvider';
import App from './App';
import './globals.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme} applyStylesToPortals>
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
    </FluentProvider>
  </React.StrictMode>
);
