/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Spinner } from "@fluentui/react-components";
import { Calendar12Regular, Dismiss16Regular } from "@fluentui/react-icons";

import { Api } from "../../../contracts/api";
import { Environment } from "../../../contracts/environment";
import { useApiService } from "../../../util/useApiService";
import { useAuthService } from "../../../util/useAuthService";
import AzureIcon from "../../../media/AzureIcon.svg";
import Options from "./Options";

import css from "./index.module.scss";

enum TTab {
    options = "options",
}

const tabs: Record<TTab, FC<{ api: Api; version?: string; definition?: string; environment?: Environment }>> = {
    [TTab.options]: Options,
};

const ApiDetail = () => {
    const apiService = useApiService();
    const authService = useAuthService();

    const { id } = useParams() as { id: string };
    const [api, setApi] = useState<Api>();
    const [selectedVersion] = useState<string[]>([]);
    const [selectedDefinition] = useState<string[]>([]);
    const [selectedTab] = useState(TTab.options);

    useEffect(() => {
        const fetchApi = async () => {
            if (!(await authService.isAuthenticated())) {
                console.log("User not authenticated");
                return;
            }
            try {
                const apiData = await apiService.getApi(id);
                console.log("API Detail Data:", apiData); // Debug log
                console.log("Title:", apiData?.title);
                console.log("Name:", apiData?.name);
                console.log("Last Updated:", apiData?.lastUpdated);
                console.log("Vendor:", apiData?.customProperties?.vendor); // Debug vendor property
                if (!apiData) {
                    console.error("No API data received");
                    return;
                }
                setApi(apiData);
            } catch (error) {
                console.error("Error fetching API details:", error);
            }
        };
        fetchApi();
    }, [id, authService, apiService]);

    const Selected = tabs[selectedTab];
    const [lastUpdatedText, setLastUpdatedText] = useState("Last updated: Not available");

    useEffect(() => {
        if (api?.lastUpdated) {
            setLastUpdatedText(`Last updated: ${new Date(api.lastUpdated).toLocaleDateString()}`);
        }
    }, [api]);

    // Disable scrolling on body when detail page is open
    useEffect(() => {
        // Save the current overflow style
        const originalStyle = window.getComputedStyle(document.body).overflow;
        // Disable scrolling on body
        document.body.style.overflow = "hidden";
        // Scroll to top
        window.scrollTo(0, 0);

        // Re-enable scrolling when component unmounts
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    return (
        <aside className={css.apiDetail}>
            <div className={css.container}>
                {!api ? (
                    <div className={css.spinner}>
                        <Spinner size={"large"} label={"Loading API details..."} labelPosition={"below"} />
                    </div>
                ) : (
                    <>
                        <div className={css.labelRow}>
                            <div className={css.titleSection}>
                                <div className={css.titleRow}>
                                    <img
                                        src={(api.customProperties?.icon as string) || AzureIcon}
                                        alt={`${api.title} icon`}
                                        className={css.apiIcon}
                                        onError={e => {
                                            // Fallback to Azure icon if custom icon fails to load
                                            if (e.currentTarget.src !== AzureIcon) {
                                                e.currentTarget.src = AzureIcon;
                                            }
                                        }}
                                    />
                                    <h1>{api?.title || api?.name || "Untitled API"}</h1>
                                </div>
                                <p className={css.lastUpdated}>
                                    <Calendar12Regular />
                                    {lastUpdatedText}
                                </p>
                            </div>
                            <Link to={"/" + window.location.search}>
                                <Dismiss16Regular />
                            </Link>
                        </div>

                        <div className={css.aboutSection}>
                            <h2 className={css.sectionTitle}>About</h2>
                            <div className={css.aboutContent}>
                                <div className={css.aboutRow}>
                                    <span className={css.rowTitle}>Description</span>
                                    {api.description || "No description available"}
                                </div>
                                <div className={css.aboutRow}>
                                    <span className={css.rowTitle}>Category</span>
                                    <div className={css.badge}>
                                        {(api.customProperties?.categories as string)?.toUpperCase() || "GENERAL"}
                                    </div>
                                </div>
                                <div className={css.aboutRow}>
                                    <span className={css.rowTitle}>Type</span>
                                    <div className={css.badge}>
                                        {(api.customProperties?.type as string)?.toUpperCase() || "UNKNOWN"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={css.optionsSection}>
                            <h2 className={css.sectionTitle}>Options</h2>
                            <Selected api={api} version={selectedVersion[0]} definition={selectedDefinition[0]} />
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
};

export default ApiDetail;
