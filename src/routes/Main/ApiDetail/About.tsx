/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC } from "react";
import { Body1, Body1Strong, Link } from "@fluentui/react-components";
import { Open16Regular } from "@fluentui/react-icons";

import { Api } from "../../../contracts/api";

import css from "./index.module.scss";

const About: FC<{ api: Api }> = ({ api }) => (
    <div className={css.about}>
        <Body1>{api.description}</Body1>
        <Body1Strong className={css.caption}>External documentation</Body1Strong>
        {!!api.externalDocumentation?.length && (
            <>
                {api.externalDocumentation.map(externalDoc => (
                    <Link href={externalDoc.url} target={"_blank"} className={css.link} key={externalDoc.title}>
                        {externalDoc.title} <Open16Regular />
                    </Link>
                ))}
            </>
        )}
        <Body1Strong className={css.caption}>Contact information</Body1Strong>
        {!!api.contacts?.length && (
            <>
                {api.contacts?.map(contact => (
                    <Link href={`mailto:${contact.email}`} target={"_blank"} className={css.link} key={contact.name}>
                        {contact.name} <Open16Regular />
                    </Link>
                ))}
            </>
        )}
    </div>
);

export default About;
