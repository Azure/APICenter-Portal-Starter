/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Outlet } from "react-router-dom";

import Footer from "./components/Footer";
import Header from "./components/Header";

const Layout = () => (
    <>
        <Header />
        <Outlet />
        <Footer />
    </>
);

export default Layout;
