/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Landing from "./routes/Main";
import ApiDetail from "./routes/Main/ApiDetail";
import Swagger from "./routes/Main/Swagger";
import ApiDetails from "./routes/ApiDetails";
import Layout from "./Layout";

const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {
                path: "/",
                element: <Landing />,
                children: [
                    {
                        path: "detail/:id",
                        element: <ApiDetail />,
                    },
                ],
            },
            {
                path: "api-details/:id",
                element: <ApiDetails />,
            },
            {
                path: "swagger/:name/:version/:definition",
                element: <Swagger />,
            },
        ],
    },
]);

const Router = () => <RouterProvider router={router} />;

export default Router;
