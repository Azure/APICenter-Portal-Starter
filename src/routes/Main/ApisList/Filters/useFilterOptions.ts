/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

import { TOption } from "../../../../types";
import { useApiService } from "../../../../util/useApiService";

export interface FilterOptions {
    categories: TOption[];
    vendors: TOption[];
    endpoint: TOption[];
    types: TOption[];
}

export const useFilterOptions = () => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        categories: [],
        vendors: [],
        endpoint: [],
        types: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const apiService = useApiService();

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                setIsLoading(true);
                // Get the full list of APIs without any filters - single API call
                const allApis = await apiService.getApis();

                // Extract unique values for each filter type
                const uniqueCategories = new Set<string>();
                const uniqueVendors = new Set<string>();
                const uniqueEndpoints = new Set<string>();
                const uniqueTypes = new Set<string>();

                allApis.value.forEach(api => {
                    // Categories
                    const category = api.customProperties?.categories;
                    if (typeof category === "string") {
                        uniqueCategories.add(category);
                    }

                    // Vendors
                    const vendor = api.customProperties?.vendor;
                    if (typeof vendor === "string") {
                        uniqueVendors.add(vendor);
                    }

                    // Endpoints
                    const endpoint = api.customProperties?.endpoint;
                    if (typeof endpoint === "string" && endpoint.trim()) {
                        uniqueEndpoints.add(endpoint.trim());
                    }

                    // Types
                    const type = api.customProperties?.type;
                    if (typeof type === "string") {
                        uniqueTypes.add(type);
                    }
                });

                // Convert to TOption format and sort alphabetically
                const categoryOptions = Array.from(uniqueCategories)
                    .sort()
                    .map(category => ({
                        value: category.toLowerCase().replace(/\s+/g, "-"),
                        label: category,
                    }));

                const vendorOptions = Array.from(uniqueVendors)
                    .sort()
                    .map(vendor => ({
                        value: vendor.toLowerCase().replace(/\s+/g, "-"),
                        label: vendor,
                    }));

                // Define the mapping for known endpoint types
                const endpointMap = {
                    Public: { value: "public", label: "Public" },
                    "AI Gateway": { value: "ai-gateway", label: "AI Gateway" },
                };

                const endpointOptions = Array.from(uniqueEndpoints)
                    .sort()
                    .map(
                        endpoint =>
                            endpointMap[endpoint as keyof typeof endpointMap] || {
                                value: endpoint.toLowerCase().replace(/\s+/g, "-"),
                                label: endpoint,
                            }
                    )
                    .filter(option => option.value);

                const typeOptions = Array.from(uniqueTypes)
                    .sort()
                    .map(type => ({
                        value: type.toLowerCase().replace(/\s+/g, "-"),
                        label: type,
                    }));

                setFilterOptions({
                    categories: categoryOptions,
                    vendors: vendorOptions,
                    endpoint: endpointOptions,
                    types: typeOptions,
                });
            } catch (error) {
                console.error("Failed to fetch filter options:", error);
                setFilterOptions({
                    categories: [],
                    vendors: [],
                    endpoint: [],
                    types: [],
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchFilterOptions();
    }, [apiService]);

    return { filterOptions, isLoading };
};
