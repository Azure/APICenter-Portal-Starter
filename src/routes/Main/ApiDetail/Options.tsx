/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC, useEffect, useState } from "react";
import { Button } from "@fluentui/react-components";
import { Copy16Regular, Open16Regular } from "@fluentui/react-icons";

import VsCodeLogo from "../../../components/logos/VsCodeLogo";
import { Api } from "../../../contracts/api";
import { ApiDeployment } from "../../../contracts/apiDeployment";
import { Environment } from "../../../contracts/environment";
import { useApiService } from "../../../util/useApiService";

import css from "./index.module.scss";

const Options: FC<{ api: Api; version?: string; definition?: string; environment?: Environment }> = ({ api }) => {
    const apiService = useApiService();
    const [deployments, setDeployments] = useState<ApiDeployment[]>([]);

    useEffect(() => {
        const fetchDeployments = async () => {
            if (api?.name) {
                try {
                    const result = await apiService.getDeployments(api.name);
                    setDeployments(result?.value || []);
                } catch (error) {
                    console.error("Error fetching deployments:", error);
                }
            }
        };

        fetchDeployments();
    }, [api?.name, apiService]);

    // Copy to clipboard functionality
    const copyToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const tempInput = document.createElement("textarea");
                tempInput.value = text;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand("copy");
                document.body.removeChild(tempInput);
            }
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
        }
    };

    const handleVsCodeInstall = (vscodeType: string) => {
        if (deployments.length === 0) {
            console.error("No deployments available");
            return;
        }

        // Get the first deployment and its runtime URI
        const deployment = deployments[0];
        const runtimeUri = deployment?.server?.runtimeUri?.[0];

        if (!runtimeUri) {
            console.error("No runtime URI available");
            return;
        }

        // For local APIs, just open the deployment URL
        if (api.customProperties?.type === "local") {
            try {
                window.open(runtimeUri, "_blank");
            } catch (error) {
                console.error("Error opening deployment URL:", error);
            }
            return;
        }

        // For remote APIs, use the original VS Code protocol handler logic
        // Create the installation object in the format {"name":"api-name","url":"server-url"}
        const installObj = {
            name: api.name,
            url: runtimeUri,
        };

        // Encode the JSON data properly for URL
        const encodedData = encodeURIComponent(JSON.stringify(installObj));

        // Create the VS Code extension installation link with properly encoded parameters
        const link = `${vscodeType}:mcp/install?${encodedData}`;

        try {
            // Try to open the link with the protocol handler
            window.open(link, "_blank");

            // Add a fallback message if the protocol handler might not work
            setTimeout(() => {
                // If nothing happened after a short delay, provide alternative instructions
                const isVisible = document.visibilityState === "visible";
                if (isVisible) {
                    console.log("If VS Code didn't open, make sure the MCP extension is installed in VS Code.");
                }
            }, 1000);
        } catch (error) {
            console.error("Error opening VS Code:", error);
        }
    };

    return (
        <div className={css.options}>
            <div className={css.option}>
                <div className={css.optionInfo}>
                    {api.customProperties?.type === "remote" && deployments.length > 0 && (
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h3
                                style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    color: "var(--colorNeutralForeground1)",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                Endpoint
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span
                                    style={{
                                        fontSize: "0.875rem",
                                        fontFamily: "monospace",
                                        padding: "0.5rem",
                                        backgroundColor: "var(--colorNeutralBackground3)",
                                        borderRadius: "4px",
                                        flex: 1,
                                    }}
                                >
                                    {deployments[0]?.server?.runtimeUri?.[0] || "No endpoint available"}
                                </span>
                                {deployments[0]?.server?.runtimeUri?.[0] && (
                                    <Button
                                        appearance={"subtle"}
                                        size={"small"}
                                        icon={<Copy16Regular />}
                                        onClick={() => copyToClipboard(deployments[0].server.runtimeUri[0])}
                                        title={"Copy endpoint URL"}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                    {api.customProperties?.type === "local" && api.externalDocumentation && (
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h3
                                style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    color: "var(--colorNeutralForeground1)",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                GitHub
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <a
                                    href={api.externalDocumentation.find(doc => doc.title === "GitHub")?.url}
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                    style={{
                                        fontSize: "0.875rem",
                                        textDecoration: "none",
                                        color: "var(--colorBrandForeground1)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.25rem",
                                    }}
                                >
                                    <Open16Regular />
                                    View on GitHub
                                </a>
                            </div>
                        </div>
                    )}
                    <div className={css.buttonsWrapper}>
                        <p>
                            <Button size={"medium"} icon={<VsCodeLogo />} onClick={() => handleVsCodeInstall("vscode")}>
                                Install in VS Code
                            </Button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Options;
