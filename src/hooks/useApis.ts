import { useCallback, useEffect, useState } from "react";
import { Api } from "../contracts/api.ts";
import { TFilterTag } from "../routes/Main/ApisList/Filters/useFilters.ts";
import { authService, configService } from "../util/useHttpClient.ts";
import { useSession } from "../util/useSession.tsx";
import { useApiService } from "../util/useApiService.ts";
import { LocalStorageKey, useLocalStorage } from "../util/useLocalStorage.tsx";

interface UseApisParams {
    search?: string | null;
    filters?: TFilterTag[];
}

interface UseApisReturn {
    apis: Api[];
    isLoading: boolean;
}

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

async function filtersToQueryString(filters?: TFilterTag[]): Promise<string> {
    const config = await configService.getSettings();
    let result = "";

    if (!filters?.length && !config.scopingFilter?.length) {
        return result;
    }

    const groupedParams = groupByKey(filters || [], "filterTypeKey");
    const groupedParamsArray = Object.values(groupedParams);

    groupedParamsArray.forEach((paramGroup, index) => {
        result += "(";
        paramGroup.forEach((param: TFilterTag, paramIndex: number) => {
            result += param.filterQuery;

            if (paramIndex !== paramGroup.length - 1) {
                result += " or ";
            }
        });
        result += ")";

        if (index !== groupedParamsArray.length - 1) {
            result += " and ";
        }
    });
    if (result.length > 0) {
        result = "$filter=" + result;
        if (config.scopingFilter.length > 0) {
            result += " and (" + config.scopingFilter + ")";
        }
    } else if (config.scopingFilter.length > 0) {
        result = "$filter=(" + config.scopingFilter + ")";
    }

    return result;
}

export default function useApis({ search, filters }: UseApisParams = {}): UseApisReturn {
    const [apis, setApis] = useState<Api[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sortBy = useLocalStorage(LocalStorageKey.apiListSortBy).get();
    const session = useSession();
    const isAuthenticated = session.isAuthenticated();
    const apiService = useApiService();

    const fetchApis = useCallback(async () => {
        setIsLoading(true);

        const searchQuery = search ? "$search=" + search : "";
        const filterQuery = await filtersToQueryString(filters);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiService, isAuthenticated, filters, search, sortBy]);

    useEffect(() => {
        void fetchApis();
    }, [fetchApis]);

    return {
        apis,
        isLoading,
    };
}
