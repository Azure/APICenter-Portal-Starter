import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from '@/pages/Home';
import ApiInfo from '@/pages/ApiInfo';
import ApiSpec from '@/pages/ApiSpec';
import Layout from './Layout';

const app = createBrowserRouter([
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

const Router = () => <RouterProvider router={app} />;

export default React.memo(Router);
