/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Outlet } from "react-router-dom";

import ApisList from "./ApisList";
import Heading from "./Heading";

const Main = () => {
    return (
        <>
            <Outlet />

            <main>
                <Heading />
                <ApisList />
            </main>
        </>
    );
};

export default Main;
