/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spinner } from "@fluentui/react-components";
import { ApiListTableView, ApiListCardsView } from "@microsoft/api-docs-ui";

import NoApis from "../../../components/logos/NoApis";
import RestrictedAccessModal from "../../../components/RestrictedAccessModal/index";
import { LocalStorageKey, useLocalStorage } from "../../../util/useLocalStorage";
import { useSession } from "../../../util/useSession";
import useFilters from "./Filters/useFilters";
import Filters from "./Filters";
import FiltersActive from "./FiltersActive";
import FirstRow from "./FirstRow";

import css from "./index.module.scss";
import openApiToApiDocsApiAdapter from "../../../adapters/openApiToApiDocsApiAdapter.ts";
import { TLayout } from "./LayoutSwitch.tsx";
import useApis from "../../../hooks/useApis.ts";

const ApisList = () => {
    const navigate = useNavigate();
    const layout = useLocalStorage(LocalStorageKey.apiListLayout).get();
    const isRestricted = useLocalStorage(LocalStorageKey.isRestricted).get();
    const session = useSession();
    const isAuthenticated = session.isAuthenticated();

    const [filters] = useFilters();
    const [showRestrictedModal, setShowRestrictedModal] = useState<boolean>(false);

    const [searchParams] = useSearchParams();
    const search = searchParams.get("search");
    const { apis, isLoading } = useApis({ search, filters });

    const apiDocsApiList = useMemo(() => (apis || []).map(openApiToApiDocsApiAdapter), [apis]);

    useEffect(() => {
        setShowRestrictedModal(isRestricted === "true");
    }, [isRestricted]);

    const ApiListView = layout === TLayout.table ? ApiListTableView : ApiListCardsView;

    return (
        <section className={css.apisList}>
            {showRestrictedModal && <RestrictedAccessModal />}
            <Filters />

            <div className={css.main}>
                <FirstRow apis={apis} />

                <FiltersActive />

                {isLoading ? (
                    <Spinner size={"small"} />
                ) : !isAuthenticated ? (
                    <div className={css.emptyState}>Sign in or create an account to view APIs.</div>
                ) : apis?.length === 0 ? (
                    <div className={css.emptyState}>
                        <NoApis />
                        <div>Could not find APIs. Try a different search term.</div>
                    </div>
                ) : (
                    <ApiListView
                        apis={apiDocsApiList}
                        apiLinkPropsProvider={({ name }) => {
                            const linkUrl = "api-details/" + name + window.location.search;
                            // const linkUrl = "detail/" + name + window.location.search;

                            return {
                                href: linkUrl,
                                onClick: (e: React.PointerEvent<HTMLAnchorElement>) => {
                                    e.preventDefault();
                                    navigate(linkUrl);
                                },
                            };
                        }}
                        showApiType
                    />
                )}
            </div>
        </section>
    );
};

export default ApisList;
