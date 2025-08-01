/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

import { TOption } from "../../../../types";
import { useApiService } from "../../../../util/useApiService";

export const useEndpointRouting = () => {
    const [routingOptions, setRoutingOptions] = useState<TOption[]>([]);
    const apiService = useApiService();

    useEffect(() => {
        const fetchAllRoutingTypes = async () => {
            try {
                // Get the full list of APIs without any filters
                const allApis = await apiService.getApis();

                // Get unique endpoint routing values from all APIs
                const uniqueRoutings = new Set<string>();
                allApis.value.forEach(api => {
                    const routing = api.customProperties?.["endpoint"];
                    if (typeof routing === "string" && routing.trim()) {
                        uniqueRoutings.add(routing.trim());
                    }
                });

                // Define the mapping for known endpoint types
                const routingMap = {
                    Public: { value: "public", label: "Public" },
                    "AI Gateway": { value: "ai-gateway", label: "AI Gateway" },
                };

                // Convert to options using predefined mappings
                const options = Array.from(uniqueRoutings)
                    .sort()
                    .map(
                        routing =>
                            routingMap[routing as keyof typeof routingMap] || {
                                value: routing.toLowerCase().replace(/\s+/g, "-"),
                                label: routing,
                            }
                    )
                    .filter(option => option.value); // Remove any undefined mappings

                setRoutingOptions(options);
            } catch (error) {
                console.error("Failed to fetch endpoint options:", error);
                setRoutingOptions([]);
            }
        };

        fetchAllRoutingTypes();
    }, [apiService]); // Only fetch routing types once when component mounts

    return routingOptions;
};
