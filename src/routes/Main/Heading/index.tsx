/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Search from "./Search";

import css from "./index.module.scss";

const Heading = () => (
    <section className={css.heading}>
        <h1>API Center portal</h1>
        <Search />
    </section>
);

export default Heading;
