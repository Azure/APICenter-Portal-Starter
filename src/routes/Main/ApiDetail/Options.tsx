/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Body1, Body1Strong, Button, Caption1, Divider, Link, MessageBar, MessageBarBody, Tooltip } from "@fluentui/react-components";
import { ArrowDownloadRegular, Document20Regular, CheckmarkCircle12Regular, CopyRegular, OpenRegular } from "@fluentui/react-icons";

import { Api } from "../../../contracts/api";
import { Environment } from "../../../contracts/environment";
import { useApiService } from "../../../util/useApiService";
import { MarkdownProcessor } from "../../../components/MarkdownProcessor";
import VsCodeLogo from "../../../components/logos/VsCodeLogo";

import css from "./index.module.scss";

const Options: FC<{ api: Api; version?: string; definition?: string, environment?: Environment }> = ({ api, version, definition, environment }) => {
    const apiService = useApiService();    
    const navigate = useNavigate();
    const [schemaUrl, setSchemaUrl] = useState("");
    const [isDevPortalLinkCopied, setIsDevPortalLinkCopied] = useState(false);
    const [showFullInstructions, setShowFullInstructions] = useState(false);

    useEffect(() => {
        getSpecificationLink();
    }, [schemaUrl]);
    
    const getSpecificationLink = async () => {
        if (!version || !definition) return;

        const downloadUrl = await apiService.getSpecificationLink(api.name, version, definition);

        if (!downloadUrl) {
            return;
        }

        setSchemaUrl(downloadUrl);
    };

    return (
        <div className={css.options}>
            {!version || !definition ? (
                <MessageBar>
                    <MessageBarBody>There are no available options for this API.</MessageBarBody>
                </MessageBar>
            ) : (
                <>
                    <div className={css.option}>
                        <div>
                            <Document20Regular />
                        </div>
                        <div className={css.optionInfo}>
                            <div className={css.title}>
                                <Body1Strong>API Definition</Body1Strong>
                                {schemaUrl && (
                                    <>
                                        <Link href={schemaUrl} className={css.link}>
                                            <Caption1>Download</Caption1> <ArrowDownloadRegular />
                                        </Link>
                                        <Link className={css.link} onClick={() => navigate(`/swagger/${api.name}/${version}/${definition}`)}>
                                            <Caption1>View documentation</Caption1>
                                        </Link>
                                    </>
                                )}
                            </div>
                            <Body1 className={css.description}>
                                This file defines how to use the API, including the endpoints, policies, authentication, and
                                responses.
                            </Body1>
                            <div className={css.buttonsWrapper}>
                                <Button
                                    icon={<VsCodeLogo />}
                                    onClick={() => window.open(`vscode:extension/apidev.azure-api-center`)}
                                >
                                    Open in Visual Studio Code
                                </Button>
                            </div>
                        </div>
                    </div>
                    {environment?.onboarding &&
                        <>
                            <Divider />
                            <div className={css.option}>
                                <div className={css.devPortalLogo}></div>
                                <div className={css.optionInfo}>
                                    <div className={css.title}>
                                        <Body1Strong>{environment.title} developer portal</Body1Strong>
                                        {(environment.onboarding.developerPortalUri?.length ?? 0) > 0 && (
                                            <>
                                                <Tooltip
                                                    content={
                                                        <div className={css.copiedTooltip}>
                                                            <CheckmarkCircle12Regular />
                                                            Copied to clipboard
                                                        </div>
                                                    }
                                                    relationship={"description"}
                                                    visible={isDevPortalLinkCopied}
                                                    positioning={"below"}
                                                    onVisibleChange={() => setTimeout(() => setIsDevPortalLinkCopied(false), 2000)}
                                                >
                                                    <Link className={css.link} onClick={() => {
                                                        navigator.clipboard.writeText(environment.onboarding?.developerPortalUri?.[0] ?? "");
                                                        setIsDevPortalLinkCopied(true);
                                                    }}>
                                                        <Caption1>Copy URL</Caption1> <CopyRegular />
                                                    </Link>
                                                </Tooltip>
                                                <Link href={environment.onboarding?.developerPortalUri?.[0]} target="_blank" className={css.link}>
                                                    <Caption1>Open in a new tab</Caption1> <OpenRegular />
                                            </Link>
                                            </>
                                        )}
                                    </div>
                                    {environment.onboarding.instructions ? (
                                        <Body1 className={css.description}>
                                            <MarkdownProcessor
                                                markdownToDisplay={environment.onboarding.instructions}
                                                maxChars={showFullInstructions ? undefined : 200} />
                                            {environment.onboarding.instructions.length > 200 && (
                                                <Link onClick={() => setShowFullInstructions(!showFullInstructions)}>
                                                    {showFullInstructions ? "Show less" : "Show more"}
                                                </Link>
                                            )}
                                        </Body1>
                                    ) : (
                                        <Body1 className={css.description}>
                                            Gain comprehensive insights into the API.
                                        </Body1>
                                    )}
                                </div>
                            </div>
                        </>
                    }
                </>
            )}
        </div>
    );
};

export default Options;
