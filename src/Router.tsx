/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Landing from "./routes/Main";
import ApiDetail from "./routes/Main/ApiDetail";
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
        ],
    },
]);

const Router = () => <RouterProvider router={router} />;

export default Router;
