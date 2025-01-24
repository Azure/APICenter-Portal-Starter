/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SwaggerUI from "swagger-ui-react";
import AsyncApiComponent from "@asyncapi/react-component/browser";
import "@asyncapi/react-component/styles/default.min.css";
import { Spinner } from "@fluentui/react-components";
import { useApiService } from "../../../util/useApiService";

import "swagger-ui-react/swagger-ui.css";

const Swagger = () => {
    const apiService = useApiService();
    const { name, version, definition: definitionName } = useParams() as {
        name: string;
        version: string;
        definition: string;
    };

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [specification, setSpecification] = useState(null);
    const [specType, setSpecType] = useState("rest");

    useEffect(() => {
        setIsLoading(true);
        getSpecificationLink();
    }, [name, version, definitionName]);

    const getSpecificationLink = async () => {
        if (!version || !definitionName) return;

        const definition = await apiService.getDefinition(
            name,
            version,
            definitionName
        );

        const specName = definition.specification?.name ?? "rest";
        setSpecType(specName);

        const downloadUrl = await apiService.getSpecificationLink(
            name,
            version,
            definitionName
        );
        const downloadResult = await fetch(downloadUrl);
        const content: any = await downloadResult.text();

        setSpecification(content);
        setIsLoading(false);
    };

    return (
        <main className="doc-container">
            {isLoading ? (
                <Spinner />
            ) : specType === "asyncapi" ? (
                specification && <AsyncApiComponent schema={specification} />
            ) : (
                specification && <SwaggerUI spec={specification} />
                
            )}
        </main>
    );
};

export default Swagger;
