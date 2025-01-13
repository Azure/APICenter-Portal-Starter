/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Body1Strong, Link } from "@fluentui/react-components";

import css from "./index.module.scss";

const Footer = () => {
    return (
        <footer>
            <div className={css.footerBottom}>
                <div className={css.bottomLinks}>
                    <Body1Strong className={css.copyright}>&copy; Copyright 2025</Body1Strong>                    
                </div>
            </div>
        </footer>
    );
};

export default Footer;
