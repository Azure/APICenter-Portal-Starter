/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { FC } from "react";
import { Body1, Body1Strong, Link } from "@fluentui/react-components";
import { Open16Regular } from "@fluentui/react-icons";

import { Api } from "../../../contracts/api";

import css from "./index.module.scss";

const About: FC<{ api: Api }> = ({ api }) => (
    <div className={css.aboutSection}>
        <Body1Strong>About this API</Body1Strong>
        <div className={css.aboutContent}>
            <div className={css.aboutRow}>
                <Body1Strong>Description:</Body1Strong>
                <span>{api.description}</span>
            </div>
            {!!api.externalDocumentation?.length && (
                <div className={css.aboutRow}>
                    <Body1Strong>Documentation:</Body1Strong>
                    <div>
                        {api.externalDocumentation.map(
                            externalDoc =>
                                externalDoc.title &&
                                externalDoc.url && (
                                    <Link
                                        href={
                                            externalDoc.url.startsWith("http://") ||
                                            externalDoc.url.startsWith("https://")
                                                ? externalDoc.url
                                                : `https://${externalDoc.url}`
                                        }
                                        target={"_blank"}
                                        className={css.link}
                                        key={externalDoc.title}
                                    >
                                        {externalDoc.title} <Open16Regular />
                                    </Link>
                                )
                        )}
                    </div>
                </div>
            )}
            {!!api.contacts?.length && (
                <div className={css.aboutRow}>
                    <Body1Strong>Contact:</Body1Strong>
                    <div>
                        {api.contacts?.map(contact => (
                            <React.Fragment key={contact.name}>
                                {contact.email ? (
                                    <Link href={`mailto:${contact.email}`} target={"_blank"} className={css.link}>
                                        {contact.name} <Open16Regular />
                                    </Link>
                                ) : (
                                    <Body1>{contact.name}</Body1>
                                )}
                                {contact.url && (
                                    <Link
                                        href={
                                            contact.url.startsWith("http://") || contact.url.startsWith("https://")
                                                ? contact.url
                                                : `https://${contact.url}`
                                        }
                                        target={"_blank"}
                                        className={css.link}
                                    >
                                        {contact.url} <Open16Regular />
                                    </Link>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
);

export default About;
