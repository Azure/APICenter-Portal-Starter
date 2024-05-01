/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Divider, Dropdown, Option, Spinner, Subtitle2, Tab, TabList } from "@fluentui/react-components";
import { Dismiss16Regular } from "@fluentui/react-icons";

import { Api } from "../../../contracts/api";
import { ApiDefinition } from "../../../contracts/apiDefinition";
import { ApiDeployment } from "../../../contracts/apiDeployment";
import { ApiVersion } from "../../../contracts/apiVersion";
import { useApiService } from "../../../util/useApiService";
import { useAuthService } from "../../../util/useAuthService";
import About from "./About";
import Options from "./Options";

import css from "./index.module.scss";

enum TTab {
    options = "options",
    about = "about",
}

const tabs: Record<TTab, FC<{ api: Api; version?: string; definition?: string }>> = {
    [TTab.options]: Options,
    [TTab.about]: About,
};

const ApiDetail = () => {
    const apiService = useApiService();
    const authService = useAuthService();

    const { id } = useParams() as { id: string };
    const [api, setApi] = useState<Api>();
    const [versions, setVersions] = useState<[ApiVersion]>();
    const [definitions, setDefinitions] = useState<[ApiDefinition]>();
    const [deployments, setDeployments] = useState<[ApiDeployment]>();
    const [selectedTab, setSelectedTab] = useState(TTab.options);
    const [selectedVersion, setSelectedVersion] = useState<string[]>([]);
    const [selectedVersionLabel, setSelectedVersionLabel] = useState<string>(`Version isn't available`);
    const [selectedDefinition, setSelectedDefinition] = useState<string[]>([]);
    const [selectedDefinitionLabel, setSelectedDefinitionLabel] = useState<string>(`Definition isn't available`);
    const [selectedDeployment, setSelectedDeployment] = useState<string[]>([]);
    const [selectedDeploymentLabel, setSelectedDeploymentLabel] = useState<string>(`Deployment isn't available`);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        fetchApi();
    }, [id, isAuthenticated]);

    useEffect(() => {
        setIsLoading(true);
        if (isAuthenticated && selectedVersion.length > 0) {
            fetchDefinitions();
        }
    }, [selectedVersion, isAuthenticated]);

    const Selected = tabs[selectedTab];

    const fetchApi = async () => {
        const isAuthenticatedResponse = await authService.isAuthenticated();
        setIsAuthenticated(isAuthenticatedResponse);

        const api = await apiService.getApi(id);
        setApi(api);

        const versions = await apiService.getVersions(id);
        setVersions(versions.value);

        if (versions.value.length > 0) {
            setSelectedVersion([versions.value[0].name]);
            setSelectedVersionLabel(versions.value[0].title);
        }

        const deployments = await apiService.getDeployments(id);
        setDeployments(deployments.value);
        if (deployments.value.length > 0) {
            setSelectedDeployment([deployments.value[0].name]);
            setSelectedDeploymentLabel(deployments.value[0].title);
        }
    };

    const fetchDefinitions = async () => {
        const definitions = await apiService.getDefinitions(id, selectedVersion[0]);
        setDefinitions(definitions.value);

        if (definitions.value.length > 0) {
            setSelectedDefinition([definitions.value[0].name]);
            setSelectedDefinitionLabel(definitions.value[0].title);
        }
        setIsLoading(false);
    };

    return (
        <aside className={css.apiDetail}>
            <div className={css.container}>
                {!api ? (
                    <Spinner size={"small"} label={"Loading..."} labelPosition={"below"} className={css.spinner} />
                ) : (
                    <>
                        <div className={css.labelRow}>
                            <h1>{api.title}</h1>
                            <Link to={"/" + window.location.search}>
                                <Dismiss16Regular />
                            </Link>
                        </div>

                        <div className={css.metadataRow}>
                            {/* TODO: add CREATOR */}
                            {/* <p>Creator {api.contacts?.name}</p>
                            <CircleFilled /> */}
                            <p>Last update {new Date(api.lastUpdated).toLocaleDateString()}</p>
                        </div>

                        <Subtitle2>Select the API version</Subtitle2>
                        <Divider className={css.divider} />

                        <p>
                            Choose the API version, definition format, and deployment lifecycle stage. You can then
                            download the definition, open it in Visual Studio Code, or run it in Postman.
                        </p>

                        <div className={css.dropdown}>
                            <label htmlFor={"version"}>Version</label>
                            <Dropdown
                                id={"version"}
                                placeholder={"Select API version"}
                                onOptionSelect={(_, data) => {
                                    setSelectedVersion(data.selectedOptions);
                                    setSelectedVersionLabel(data.optionText ?? "");
                                }}
                                value={selectedVersionLabel}
                                selectedOptions={selectedVersion}
                            >
                                {!!versions?.length &&
                                    versions.map(o => (
                                        <Option key={o.name} value={o.name}>
                                            {o.title}
                                        </Option>
                                    ))}
                            </Dropdown>
                        </div>

                        <div className={css.dropdown}>
                            <label htmlFor={"definition"}>Definition format</label>
                            <Dropdown
                                id={"definition"}
                                placeholder={"Select API definition"}
                                onOptionSelect={(_, data) => {
                                    setSelectedDefinition(data.selectedOptions);
                                    setSelectedDefinitionLabel(data.optionText ?? "");
                                }}
                                value={selectedDefinitionLabel}
                                selectedOptions={selectedDefinition}
                            >
                                {!!definitions?.length &&
                                    definitions.map(o => (
                                        <Option key={o.name} value={o.name}>
                                            {o.title}
                                        </Option>
                                    ))}
                            </Dropdown>
                        </div>

                        <div className={css.dropdown}>
                            <label htmlFor={"deployment"}>Deployment</label>
                            <Dropdown
                                id={"deployment"}
                                placeholder={"Select deployment"}
                                onOptionSelect={(_, data) => {
                                    setSelectedDeployment(data.selectedOptions);
                                    setSelectedDeploymentLabel(data.optionText ?? "");
                                }}
                                value={selectedDeploymentLabel}
                                selectedOptions={selectedDeployment}
                            >
                                {!!deployments?.length &&
                                    deployments.map(o => (
                                        <Option key={o.name} value={o.name}>
                                            {o.title}
                                        </Option>
                                    ))}
                            </Dropdown>
                        </div>

                        <div className={css.tabsContainer}>
                            <TabList
                                selectedValue={selectedTab}
                                onTabSelect={(_, { value }) => setSelectedTab(value as TTab)}
                            >
                                <Tab value={TTab.options}>Options</Tab>
                                <Tab value={TTab.about}>More about this API</Tab>
                            </TabList>
                            <Divider />
                        </div>

                        {isLoading ? (
                            <Spinner size={"small"} />
                        ) : (
                            <Selected
                                api={api}
                                version={selectedVersion.length > 0 ? selectedVersion[0] : ""}
                                definition={selectedDefinition.length > 0 ? selectedDefinition[0] : ""}
                            />
                        )}
                    </>
                )}
            </div>
        </aside>
    );
};

export default ApiDetail;
