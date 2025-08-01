/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

import { TOption } from "../../../../types";
import { useApiService } from "../../../../util/useApiService";

export const useTypes = () => {
    const [typeOptions, setTypeOptions] = useState<TOption[]>([]);
    const apiService = useApiService();

    useEffect(() => {
        const fetchAllTypes = async () => {
            try {
                // Get the full list of APIs without any filters
                const allApis = await apiService.getApis();

                // Get unique types from all APIs
                const uniqueTypes = new Set<string>();
                allApis.value.forEach(api => {
                    const type = api.customProperties?.type;
                    if (typeof type === "string") {
                        uniqueTypes.add(type);
                    }
                });

                // Convert to TOption format and sort alphabetically
                const options = Array.from(uniqueTypes)
                    .sort()
                    .map(type => ({
                        value: type.toLowerCase().replace(/\s+/g, "-"),
                        label: type,
                    }));

                setTypeOptions(options);
            } catch (error) {
                console.error("Failed to fetch types:", error);
                setTypeOptions([]);
            }
        };

        fetchAllTypes();
    }, [apiService]); // Only fetch types once when component mounts

    return typeOptions;
};
