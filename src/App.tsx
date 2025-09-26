import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import Home from '@/pages/Home';
import ApiInfo from '@/pages/ApiInfo';
import ApiSpec from '@/pages/ApiSpec';
import { configAtom } from '@/atoms/configAtom';
import Layout from './Layout';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const setConfig = useSetRecoilState(configAtom);

  const router = useMemo(() => {
    if (!isInitialized) {
      return undefined;
    }

    return createBrowserRouter([
      {
        element: <Layout />,
        children: [
          {
            path: '/',
            element: <Home />,
            children: [
              {
                path: 'api-info/:id',
                element: <ApiInfo />,
              },
            ],
          },
          {
            path: 'apis/:apiName/versions/:versionName/definitions/:definitionName',
            element: <ApiSpec />,
          },
        ],
      },
    ]);
  }, [isInitialized]);

  const fetchConfig = useCallback(async () => {
    if (isInitialized) {
      return;
    }

    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }
    const config = await response.json();
    setConfig({
      title: 'API portal',
      capabilities: [],
      ...config,
    });
    setIsInitialized(true);
  }, [isInitialized, setConfig]);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  if (!router) {
    return null;
  }

  return <RouterProvider router={router} />;
};

export default React.memo(App);
