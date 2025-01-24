import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

import { LocalStorageProvider } from './util/useLocalStorage';
import { SessionProvider } from './util/useSession';
import Router from './Router';

import './globals.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme} className="contentWrapper" style={{ height: '100%' }}>
      <RecoilRoot>
        <SessionProvider>
          <LocalStorageProvider>
            <Router />
          </LocalStorageProvider>
        </SessionProvider>
      </RecoilRoot>
    </FluentProvider>
  </React.StrictMode>
);
