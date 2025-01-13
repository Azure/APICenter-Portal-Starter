import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select, SelectOnChangeData } from "@fluentui/react-components";
import { Search16Regular } from "@fluentui/react-icons";
import { ApiOperationInfo, ApiOperationsList, ParametersTable } from "@microsoft/api-docs-ui";

import useApis from "../../hooks/useApis.ts";
import { operations, parameters } from "./mockData.ts";

import styles from "./ApiDetails.module.scss";

interface Props {}

export const ApiDetails: React.FC<Props> = () => {
    const { id } = useParams<{ id: string }>();
    const { apis } = useApis();
    const navigate = useNavigate();

    const handleApiSelect = useCallback(
        (_, { value }: SelectOnChangeData) => {
            navigate(`/api-details/${value}`);
        },
        [navigate]
    );

    return (
        <div className={styles.apiDetails}>
            <div className={styles.operations}>
                <h3>API</h3>
                <Select value={id} onChange={handleApiSelect}>
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
                    selectedOperationName={operations[0].name}
                    onOperationSelect={() => {}}
                />
            </div>
            <div className={styles.details}>
                <h1>{id}</h1>

                <h4>Operation</h4>
                <ApiOperationInfo
                    requestUrl={"https://api-example.azure-api.net/v1/users"}
                    operation={{
                        name: "createUser",
                        description: "Creates a new user in the system.",
                        method: "POST",
                        urlTemplate: "/users",
                        displayName: "Create new user",
                    }}
                />

                <h4>Request</h4>
                <h5>Request parameters</h5>
                <ParametersTable parameters={parameters} />
            </div>
        </div>
    );
};

export default React.memo(ApiDetails);
