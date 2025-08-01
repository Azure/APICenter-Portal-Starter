/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TOption } from "./types";

export const TableColumns = [
    { label: "Name", value: "name" },
    { label: "Description", value: "kind" },
    { label: "Type", value: "lifecycleStage" },
    { label: "Category", value: "description" },
    // {label: "Created by", value: "createdBy"},
] as const;

export const SortingOptions = [
    { label: "A to Z, ascending", value: "name.asc" },
    { label: "Z to A, descending", value: "name.desc" },
];

export const ApiFilters: {
    [key: string]: {
        label: string;
        visible: boolean;
        options: TOption[];
    };
} = {
    types: {
        label: "Types",
        visible: true,
        options: [],
    },
    vendors: {
        label: "Vendors",
        visible: true,
        options: [],
    },
    endpoint: {
        label: "Endpoint",
        visible: true,
        options: [],
    },
    categories: {
        label: "Categories",
        visible: true,
        options: [],
    },
    kind: {
        label: "API type",
        visible: false,
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
        visible: false,
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
