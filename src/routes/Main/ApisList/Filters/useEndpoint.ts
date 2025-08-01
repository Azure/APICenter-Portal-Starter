/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

import { TOption } from "../../../../types";
import { useApiService } from "../../../../util/useApiService";

export const useEndpoint = () => {
    const [routingOptions, setRoutingOptions] = useState<TOption[]>([]);
    const apiService = useApiService();

    useEffect(() => {
        const fetchAllEndpoints = async () => {
            try {
                // Get the full list of APIs without any filters
                const allApis = await apiService.getApis();

                // Get unique endpoint values from all APIs
                const uniqueEndpoints = new Set<string>();
                allApis.value.forEach(api => {
                    const endpoint = api.customProperties?.["endpoint"];
                    if (typeof endpoint === "string" && endpoint.trim()) {
                        uniqueEndpoints.add(endpoint.trim());
                    }
                });

                // Define the mapping for known endpoint types
                const endpointMap = {
                    Public: { value: "public", label: "Public" },
                    "AI Gateway": { value: "ai-gateway", label: "AI Gateway" },
                };

                // Convert to options using predefined mappings
                const options = Array.from(uniqueEndpoints)
                    .sort()
                    .map(
                        endpoint =>
                            endpointMap[endpoint as keyof typeof endpointMap] || {
                                value: endpoint.toLowerCase().replace(/\s+/g, "-"),
                                label: endpoint,
                            }
                    )
                    .filter(option => option.value);

                setRoutingOptions(options);
            } catch (error) {
                console.error("Failed to fetch endpoint options:", error);
                setRoutingOptions([]);
            }
        };

        fetchAllEndpoints();
    }, [apiService]);

    return routingOptions;
};
