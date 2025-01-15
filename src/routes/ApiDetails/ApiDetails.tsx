import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select, SelectOnChangeData } from "@fluentui/react-components";
import { Search16Regular } from "@fluentui/react-icons";
import {
    ApiOperation,
    ApiOperationInfo,
    ApiOperationParameter,
    ApiOperationsList,
    ParametersTable,
} from "@microsoft/api-docs-ui";

import useApis from "../../hooks/useApis.ts";
import { spec } from "./mockData.ts";

import styles from "./ApiDetails.module.scss";
import { get } from "lodash";

type Params = {
    name: string;
};

const operations: ApiOperation[] = Object.keys(spec.paths).flatMap(path => {
    const pathItem = spec.paths[path];
    return Object.keys(pathItem).map(method => {
        const operation = pathItem[method];
        return {
            name: operation.operationId,
            description: operation.summary,
            method: method.toUpperCase(),
            urlTemplate: path,
            displayName: operation.summary,
        };
    });
});

function getRequestParameters(operation: ApiOperation): ApiOperationParameter[] {
    const op = spec.paths[operation.urlTemplate][operation.method.toLowerCase()];
    if (!op?.parameters) {
        return [];
    }

    return op.parameters.map((param: any) => ({
        name: param.name,
        in: param.in,
        type: param.schema.type,
        description: param.description,
        required: param.required,
    }));
}

function getResponseParameters(response): ApiOperationParameter[] {
    if (!response.content) {
        return [];
    }

    const schemaPath = response.content["application/json"].schema.$ref;
    const typeDef = get(spec, schemaPath.split("/").slice(1));

    if (!typeDef) {
        return [];
    }

    if (typeDef.type !== 'object') {
        return [];
    }

    return Object.entries<any>(typeDef.properties).map(([key, prop]) => ({
        name: key,
        in: 'body',
        type: prop.type,
        description: prop.description,
        required: typeDef.required.includes(prop.name),
    }));
}

export const ApiDetails: React.FC = () => {
    const { name } = useParams<Params>();
    const { apis } = useApis();
    const navigate = useNavigate();
    const [selectedOp, setSelectedOp] = useState(operations[0]);

    const handleApiSelect = useCallback(
        (_, { value }: SelectOnChangeData) => {
            navigate(`/api-details/${value}`);
        },
        [navigate]
    );

    function renderResponses() {
        const op = spec.paths[selectedOp.urlTemplate][selectedOp.method.toLowerCase()];
        if (!op?.responses) {
            return null;
        }

        return Object.keys(op.responses).map((code) => (
            <React.Fragment key={code}>
                <h4>Response: {code}s</h4>
                <p>{op.responses[code].description}</p>
                <ParametersTable parameters={getResponseParameters(op.responses[code])} />
            </React.Fragment>
        ));
    }

    return (
        <div className={styles.apiDetails}>
            <div className={styles.operations}>
                <h3>API</h3>
                <Select value={name} onChange={handleApiSelect}>
                    {apis.map(api => (
                        <option key={api.name} value={api.name}>
                            {api.title}
                        </option>
                    ))}
                </Select>

                <h3>Operations</h3>
                <Input className={styles.searchInput} placeholder={"Search"} contentBefore={<Search16Regular />} />
                <ApiOperationsList
                    operations={operations}
                    selectedOperationName={selectedOp.name}
                    onOperationSelect={setSelectedOp}
                />
            </div>
            <div className={styles.details}>
                <h1>{name}</h1>

                <h4 className={styles.operation}>Operation</h4>
                <ApiOperationInfo
                    requestUrl={`https://api-example.azure-api.net${selectedOp.urlTemplate}`}
                    operation={selectedOp}
                />

                <h4>Request</h4>
                <h5>Request parameters</h5>
                <ParametersTable parameters={getRequestParameters(selectedOp)} />

                {renderResponses()}
            </div>
        </div>
    );
};

export default React.memo(ApiDetails);
