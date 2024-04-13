/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC } from "react";
import { Link } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableCellLayout,
    TableHeader,
    TableHeaderCell,
    TableRow,
} from "@fluentui/react-components";

import { TableColumns } from "../../../../constants";
import { Api } from "../../../../contracts/api";

import css from "./index.module.scss";

const ApisTable: FC<{ apis: Api[] | null }> = ({ apis }) => {
    return (
        <div className={css.container}>
            <Table size={"small"} aria-label={"APIs List table"}>
                <TableHeader>
                    <TableRow>
                        {TableColumns.map(column => (
                            <TableHeaderCell key={column.value}>
                                <b>{column.label}</b>
                            </TableHeaderCell>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {apis?.map(api => (
                        <TableRow key={api.name}>
                            <TableCell>
                                <Link to={"detail/" + api.name + window.location.search} className={css.link}>
                                    {api.title}
                                </Link>
                            </TableCell>
                            <TableCell>{api.kind.toUpperCase()}</TableCell>
                            <TableCell>
                                <TableCellLayout truncate title={api.description}>
                                    {api.description}
                                </TableCellLayout>
                            </TableCell>
                            <TableCell>{new Date(api.lastUpdated).toLocaleDateString()}</TableCell>
                            {/* <TableCell>TODO</TableCell> */}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default ApisTable;
