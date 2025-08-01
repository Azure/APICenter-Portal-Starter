/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useLocation } from "react-router-dom";
import { Link } from "@fluentui/react-components";

import copilotIcon from "../../media/copilot.svg";
import msAzureLogo from "../../media/MS-Azure-logo.svg";

import css from "./index.module.scss";

const Footer = () => {
    const location = useLocation();
    const isDocsPage = location.pathname === "/docs";

    return (
        <footer className={isDocsPage ? css.docsFooter : ""}>
            <div className={css.footerBottom}>
                <div className={css.microsoftLogo}>
                    <img src={msAzureLogo} alt={"Microsoft Azure"} />
                </div>
                <div className={css.disclaimer}>
                    <span>
                        <strong>Disclaimer:</strong> This is a public showcase demonstrating how to use Azure API Center
                        to build a enterprise-ready catalog of MCP servers in line with the latest{" "}
                        <Link
                            href={"https://github.com/modelcontextprotocol/registry"}
                            target={"_blank"}
                            rel={"noopener noreferrer"}
                        >
                            MCP registry spec
                        </Link>
                        .
                    </span>
                </div>
                <div className={css.poweredBy}>
                    <span>built with </span>
                    <Link
                        href={"https://github.com/features/copilot"}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                        className={css.copilotLink}
                    >
                        GitHub Copilot
                    </Link>
                    <img src={copilotIcon} alt={"GitHub Copilot"} className={css.copilotIcon} />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
