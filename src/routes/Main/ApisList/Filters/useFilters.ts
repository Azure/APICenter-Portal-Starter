/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { ApiFilters } from "../../../../constants";

export type TFilterTag = { filterType: string; filterTypeKey: string; label: string; key: string; filterQuery: string };

const useFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    return useMemo(() => {
        const filtersActive: TFilterTag[] = [];
        searchParams.forEach((_, key) => {
            const [keyParent, keyChild] = key.split(".");
            if (!(keyParent in ApiFilters)) return;
            const filterType = ApiFilters[keyParent as keyof typeof ApiFilters];
            const value = filterType.options.find(o => o.value === keyChild)?.value;
            const label = filterType.options.find(o => o.value === keyChild)?.label;
            if (!value || !label) return;
            filtersActive.push({
                filterType: filterType.label,
                filterTypeKey: keyParent,
                label,
                key,
                filterQuery: `${keyParent} eq '${value}'`,
            });
        });
        return [filtersActive, setSearchParams] as const;
    }, [searchParams, setSearchParams]);
};

export default useFilters;
