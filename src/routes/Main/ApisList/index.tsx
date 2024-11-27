/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "@fluentui/react-components";

import NoApis from "../../../components/logos/NoApis";
import RestrictedAccessModal from "../../../components/RestrictedAccessModal/index";
import { Api } from "../../../contracts/api";
import { useApiService } from "../../../util/useApiService";
import { useAuthService } from "../../../util/useAuthService";
import { useConfigService } from "../../../util/useConfigService";
import { LocalStorageKey, useLocalStorage } from "../../../util/useLocalStorage";
import { useLogger } from "../../../util/useLogger";
import { useSession } from "../../../util/useSession";
import useFilters, { TFilterTag } from "./Filters/useFilters";
import ApisCards from "./ApisCards";
import ApisTable from "./ApisTable";
import Filters from "./Filters";
import FiltersActive from "./FiltersActive";
import FirstRow from "./FirstRow";
import { TLayout } from "./LayoutSwitch";

import css from "./index.module.scss";

const groupByKey = <T extends Record<string, any>>(list: T[], key: keyof T) =>
    list.reduce(
        (hash, obj) => ({
            ...hash,
            [obj[key]]: (hash[obj[key]] || []).concat(obj),
        }),
        {} as Record<string, T[]>
    );

const sortApis = (apis: Api[], sortBy?: string) => {
    if (sortBy) {
        const sortingOption = sortBy.split(".");
        const key = sortingOption[0];
        const order = sortingOption[1];

        if (order === "asc") {
            return [...apis].sort((a, b) => (a[key] > b[key] ? 1 : -1));
        } else {
            return [...apis].sort((a, b) => (a[key] < b[key] ? 1 : -1));
        }
    }

    return apis;
};

const ApisList = () => {
    
    const configService = useConfigService();
    const layout = useLocalStorage(LocalStorageKey.apiListLayout).get();
    const sortBy = useLocalStorage(LocalStorageKey.apiListSortBy).get();
    const isRestricted = useLocalStorage(LocalStorageKey.isRestricted).get();
    const session = useSession();
    const isAuthenticated = session.isAuthenticated();
    const apiService = useApiService();
    const authService = useAuthService();
    const logger = useLogger();

    const [filters] = useFilters();
    const [apis, setApis] = useState<Api[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showRestrictedModal, setShowRestrictedModal] = useState<boolean>(false);

    const [searchParams] = useSearchParams();
    const search = searchParams.get("search");

    useEffect(() => {
        setShowRestrictedModal(isRestricted === "true");
    }, [isRestricted]);

    useEffect(() => {
        logger.trackView("API list");
        initialize();
    }, [isAuthenticated, filters, search, sortBy]);

    const initialize = async () => {
        const config = await configService.getSettings();
        setIsLoading(true);

        let searchQuery = "";
        let filterQuery = "";

        if (search) {
            searchQuery = "$search=" + search;
        }


        if (filters?.length > 0 || config.scopingFilter?.length > 0) {
            const groupedParams = groupByKey(filters, "filterTypeKey");
            const groupedParamsArray = Object.values(groupedParams);

            groupedParamsArray.forEach((paramGroup, index) => {
                filterQuery += "(";
                paramGroup.forEach((param: TFilterTag, paramIndex: number) => {
                    filterQuery += param.filterQuery;

                    if (paramIndex !== paramGroup.length - 1) {
                        filterQuery += " or ";
                    }
                });
                filterQuery += ")";

                if (index !== groupedParamsArray.length - 1) {
                    filterQuery += " and ";
                }
            });
            if (filterQuery.length > 0) {
                filterQuery = "$filter=" + filterQuery;
                if (config.scopingFilter.length > 0) {
                    filterQuery += " and (" + config.scopingFilter + ")";    
                }    
            } else if (config.scopingFilter.length > 0) {
                filterQuery = "$filter=(" + config.scopingFilter + ")";    
            }           
        }

        const result = await authService.isAuthenticated();
        session.setAuthenticated(result);

        setIsLoading(false);

        if (filterQuery !== "" || searchQuery !== "") {
            const queryString: string[] = [];
            if (filterQuery) queryString.push(filterQuery);
            if (searchQuery) queryString.push(searchQuery);

            if (isAuthenticated) {
                const apis = await apiService.getApis(queryString.join("&"));
                setApis(sortApis(apis?.value, sortBy));
                setIsLoading(false);
            }
        } else {
            if (isAuthenticated) {
                const apis = await apiService.getApis();
                setApis(sortApis(apis?.value, sortBy));
                setIsLoading(false);
            }
        }
    };

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
                ) : layout === TLayout.table ? (
                    <ApisTable apis={apis} />
                ) : (
                    <ApisCards apis={apis} />
                )}
            </div>
        </section>
    );
};

export default ApisList;
