import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import Home from '@/pages/Home';
import ApiSpec from '@/pages/ApiSpec';
import SkillInfo from '@/pages/SkillInfo';
import PluginInfo from '@/pages/PluginInfo';
import AgentChat from '@/pages/AgentChat';
import ApiDetailPage from '@/pages/ApiDetailPage';
import ModelDetailPage from '@/pages/ModelDetailPage';
import { ModelPlayground } from '@/pages/ModelPlayground';
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
          },
          {
            path: 'apis/:apiName',
            element: <ApiDetailPage />,
          },
          {
            path: 'languageModels/:apiName',
            element: <ModelDetailPage />,
          },
          {
            path: 'languageModels/:name/playground',
            element: <ModelPlayground />,
          },
          {
            path: 'apis/:apiName/versions/:versionName/definitions/:definitionName',
            element: <ApiSpec />,
          },
          {
            path: 'languageModels/:apiName/versions/:versionName/definitions/:definitionName',
            element: <ApiSpec />,
          },
          {
            path: 'skills/:name',
            element: <SkillInfo />,
          },
          {
            path: 'plugins/:name',
            element: <PluginInfo />,
          },
          {
            path: 'agents/:name',
            element: <AgentChat />,
          },

        ],
      },
    ], {
      basename: import.meta.env.BASE_URL?.replace(/\/+$/, '') || '/',
    });
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
