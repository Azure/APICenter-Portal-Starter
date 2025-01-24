import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from '@/pages/Home';
import ApiInfo from '@/pages/ApiInfo';
import Swagger from '@/pages/Swagger';
import Layout from './Layout';

const router = createBrowserRouter([
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
        path: 'specs/:name/:version/:definition',
        element: <Swagger />,
      },
    ],
  },
]);

const Router = () => <RouterProvider router={router} />;

export default Router;
