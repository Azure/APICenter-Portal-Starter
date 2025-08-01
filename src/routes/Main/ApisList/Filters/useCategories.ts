/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

import { TOption } from "../../../../types";
import { useApiService } from "../../../../util/useApiService";

export const useCategories = () => {
    const [categoryOptions, setCategoryOptions] = useState<TOption[]>([]);
    const apiService = useApiService();

    useEffect(() => {
        const fetchAllCategories = async () => {
            try {
                // Get the full list of APIs without any filters
                const allApis = await apiService.getApis();

                // Get unique categories from all APIs
                const uniqueCategories = new Set<string>();
                allApis.value.forEach(api => {
                    const category = api.customProperties?.categories;
                    if (typeof category === "string") {
                        uniqueCategories.add(category);
                    }
                });

                // Convert to TOption format and sort alphabetically
                const options = Array.from(uniqueCategories)
                    .sort()
                    .map(category => ({
                        value: category.toLowerCase().replace(/\s+/g, "-"),
                        label: category,
                    }));

                setCategoryOptions(options);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                setCategoryOptions([]);
            }
        };

        fetchAllCategories();
    }, [apiService]); // Only fetch categories once when component mounts

    return categoryOptions;
};
