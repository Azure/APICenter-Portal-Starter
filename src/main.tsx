import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import App from './App';
import './globals.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme} className="app-root">
      <RecoilRoot>
        <App />
      </RecoilRoot>
    </FluentProvider>
  </React.StrictMode>
);
