/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ApiFilters } from "../../../../constants";
import { TOption } from "../../../../types";
import { useApiService } from "../../../../util/useApiService";

export type TFilterTag = { filterType: string; filterTypeKey: string; label: string; key: string; filterQuery: string };

// Map of filter keys to their customProperties names
const customPropertiesMap = {
    categories: "categories",
    vendors: "vendor",
    endpoint: "endpoint",
    types: "type",
};

const useFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filterOptions, setFilterOptions] = useState<{
        categories: TOption[];
        vendors: TOption[];
        endpoint: TOption[];
        types: TOption[];
    }>({
        categories: [],
        vendors: [],
        endpoint: [],
        types: [],
    });
    const [_isLoading, setIsLoading] = useState(true);
    const apiService = useApiService();

    // Fetch filter options once
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                setIsLoading(true);
                // Single API call to get all APIs
                const allApisResponse = await apiService.getApis();

                // Extract unique values for each filter type
                const uniqueCategories = new Set<string>();
                const uniqueVendors = new Set<string>();
                const uniqueEndpoints = new Set<string>();
                const uniqueTypes = new Set<string>();

                allApisResponse.value.forEach(api => {
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

                // Define endpoint mapping
                const endpointMap = {
                    Public: { value: "public", label: "Public" },
                    "AI Gateway": { value: "ai-gateway", label: "AI Gateway" },
                };

                // Convert to options
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

                const endpointOptions = Array.from(uniqueEndpoints)
                    .sort()
                    .map(endpoint =>
                        endpointMap[endpoint as keyof typeof endpointMap] || {
                            value: endpoint.toLowerCase().replace(/\s+/g, "-"),
                            label: endpoint,
                        }
                    );

                const typeOptions = Array.from(uniqueTypes)
                    .sort()
                    .map(type => ({
                        value: type, // Keep the exact original value from the API
                        label: type === "local" ? "Local" : type === "remote" ? "Remote" : type,
                    }));

                setFilterOptions({
                    categories: categoryOptions,
                    vendors: vendorOptions,
                    endpoint: endpointOptions,
                    types: typeOptions,
                });
            } catch (error) {
                console.error("Failed to fetch filter options:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFilterOptions();
    }, [apiService]);

    const filtersActive = useMemo(() => {
        const result: TFilterTag[] = [];
        
        // Create updated filters with current options
        const currentFilters = { ...ApiFilters };
        currentFilters.categories.options = filterOptions.categories;
        currentFilters.vendors.options = filterOptions.vendors;
        currentFilters.endpoint.options = filterOptions.endpoint;
        currentFilters.types.options = filterOptions.types;
        
        searchParams.forEach((_, key) => {
            const [keyParent, keyChild] = key.split(".");
            if (!(keyParent in currentFilters)) return;

            const filterType = currentFilters[keyParent as keyof typeof currentFilters];
            const option = filterType.options.find(o => o.value === keyChild);
            if (!option) return;

            // Get the correct property name from customProperties
            const customPropertyName = customPropertiesMap[keyParent as keyof typeof customPropertiesMap];

            // For endpoint, ensure exact matches for Public and AI Gateway
            let filterValue = option.label;
            if (keyParent === "endpoint") {
                // Explicitly handle all possible endpoint values
                switch (option.value) {
                    case "public":
                        filterValue = "Public";
                        break;
                    case "ai-gateway":
                        filterValue = "AI Gateway";
                        break;
                    default:
                        filterValue = option.label;
                }
            } else if (keyParent === "types") {
                // For types, use the original API data value, not the display label
                filterValue = option.value;
            }

            // Build the filter query using OData syntax with single quotes for string literals
            // Escape any single quotes in the values by doubling them
            const escapedFilterValue = filterValue.replace(/'/g, "''");
            const escapedOptionValue = option.value.replace(/'/g, "''");

            const filterQuery = customPropertyName
                ? `customProperties/${customPropertyName} eq '${escapedFilterValue}'`
                : `${keyParent} eq '${escapedOptionValue}'`;

            console.log("Filter Query:", filterQuery); // For debugging

            result.push({
                filterType: filterType.label,
                filterTypeKey: keyParent,
                label: option.label,
                key,
                filterQuery,
            });
        });
        return result;
    }, [searchParams, filterOptions]);

    return [filtersActive, setSearchParams, filterOptions, !_isLoading] as const;
};

export default useFilters;
