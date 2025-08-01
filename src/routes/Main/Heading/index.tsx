/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Background from "../../../media/background4.svg";
import Search from "./Search";

import css from "./index.module.scss";

const Heading = () => (
    <section
        className={css.heading}
        style={{
            backgroundImage: `url(${Background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
        }}
    >
        <h1>MCP Center</h1>
        <Search />
    </section>
);

export default Heading;
