/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

import { TOption } from "../../../../types";
import { useApiService } from "../../../../util/useApiService";

export const useVendors = () => {
    const [vendorOptions, setVendorOptions] = useState<TOption[]>([]);
    const apiService = useApiService();

    useEffect(() => {
        const fetchAllVendors = async () => {
            try {
                // Get the full list of APIs without any filters
                const allApis = await apiService.getApis();

                // Get unique vendors from all APIs
                const uniqueVendors = new Set<string>();
                allApis.value.forEach(api => {
                    const vendor = api.customProperties?.vendor;
                    if (typeof vendor === "string") {
                        uniqueVendors.add(vendor);
                    }
                });

                // Convert to TOption format and sort alphabetically
                const options = Array.from(uniqueVendors)
                    .sort()
                    .map(vendor => ({
                        value: vendor.toLowerCase().replace(/\s+/g, "-"),
                        label: vendor,
                    }));

                setVendorOptions(options);
            } catch (error) {
                console.error("Failed to fetch vendors:", error);
                setVendorOptions([]);
            }
        };

        fetchAllVendors();
    }, [apiService]); // Only fetch vendors once when component mounts

    return vendorOptions;
};
