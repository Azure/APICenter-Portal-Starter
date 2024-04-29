/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const TableColumns = [
    { label: "Name", value: "name" },
    { label: "Type", value: "kind" },
    { label: "Description", value: "description" },
    { label: "Last updated", value: "lastUpdated" },
    // {label: "Created by", value: "createdBy"},
] as const;

export const SortingOptions = [
    { label: "A to Z, ascending", value: "name.asc" },
    { label: "Z to A, descending", value: "name.desc" },
    { label: "Newest to oldest", value: "lastUpdated.desc" },
    { label: "Oldest to newest", value: "lastUpdated.asc" },
];

export const ApiFilters = {
    kind: {
        label: "API type",
        options: [
            { value: "rest", label: "REST" },
            { value: "graphql", label: "GraphQL" },
            { value: "grpc", label: "gRPC" },
            { value: "soap", label: "SOAP" },
            { value: "webhook", label: "Webhook" },
            { value: "websocket", label: "WebSocket" },
        ],
    },
    lifecycleStage: {
        label: "Lifecycle",
        options: [
            { value: "design", label: "Design" },
            { value: "development", label: "Development" },
            { value: "testing", label: "Testing" },
            { value: "preview", label: "Preview" },
            { value: "production", label: "Production" },
            { value: "deprecated", label: "Deprecated" },
            { value: "retired", label: "Retired" },
        ],
    },
};
