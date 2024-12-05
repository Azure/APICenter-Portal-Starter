/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SwaggerUI from "swagger-ui-react";
import { Spinner } from "@fluentui/react-components";
import { useApiService } from "../../../util/useApiService";

import "swagger-ui-react/swagger-ui.css";

const Swagger = () => {
    const apiService = useApiService();
    const { name, version, definition } = useParams() as { name: string, version: string, definition: string };

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [specification, setSpecification] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        getSpecificationLink();
    }, [name, version, definition]);
    
    const getSpecificationLink = async () => {
        if (!version || !definition) return;

        const downloadUrl = await apiService.getSpecificationLink(name, version, definition);
        const downloadResult = await fetch(downloadUrl);
        const content: any = await downloadResult.text();

        setSpecification(content);
        setIsLoading(false);
    };

    return (
        <main>
            {isLoading
                ? <Spinner />
                : specification && <SwaggerUI spec={specification} />
            }
        </main>
    );
}

export default Swagger;
