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
                    <Body1Strong className={css.link}>&copy; Copyright 2024</Body1Strong>
                    <Link appearance={"subtle"} href={"#"}>
                        <Body1Strong className={css.link}>Terms</Body1Strong>
                    </Link>
                    <Link appearance={"subtle"} href={"#"}>
                        <Body1Strong className={css.link}>Privacy</Body1Strong>
                    </Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
