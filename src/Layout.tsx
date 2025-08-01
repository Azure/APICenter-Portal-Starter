/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Outlet } from "react-router-dom";

import Footer from "./components/Footer";
import Header from "./components/Header";

// Use a wrapper div to create a flex container that ensures the footer stays at the bottom
const Layout = () => (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: "1 0 auto" }}>
            <Outlet />
        </div>
        <Footer />
    </div>
);

export default Layout;
