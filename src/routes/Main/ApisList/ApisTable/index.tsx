/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from "@fluentui/react-components";

import { TableColumns } from "../../../../constants";
import { Api } from "../../../../contracts/api";
import AzureIcon from "../../../../media/AzureIcon.svg";

import css from "./index.module.scss";

const ApisTable: FC<{ apis: Api[] | null }> = ({ apis }) => {
    return (
        <div className={css.container}>
            <Table size={"medium"} aria-label={"APIs List table"}>
                <TableHeader>
                    <TableRow className={css.headerRow}>
                        {TableColumns.map(column => (
                            <TableHeaderCell key={column.value} className={css.headerCell}>
                                {column.label}
                            </TableHeaderCell>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {apis?.map(api => {
                        const iconUrl = api.customProperties?.icon as string;
                        return (
                            <TableRow key={api.name} className={css.tableRow}>
                                <TableCell className={css.tableCell}>
                                    <div className={css.titleWithIcon}>
                                        <img
                                            src={iconUrl || AzureIcon}
                                            alt={`${api.title} icon`}
                                            className={css.apiIcon}
                                            onError={e => {
                                                // Fallback to Azure icon if custom icon fails to load
                                                if (e.currentTarget.src !== AzureIcon) {
                                                    e.currentTarget.src = AzureIcon;
                                                }
                                            }}
                                        />
                                        <Link to={"detail/" + api.name + window.location.search} className={css.link}>
                                            {api.title}
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell className={css.tableCell}>
                                    <div className={css.description} title={api.description}>
                                        {api.description}
                                    </div>
                                </TableCell>
                                <TableCell className={css.tableCell}>
                                    <div className={css.badge}>{(api.customProperties?.type as string)?.toLowerCase() || ""}</div>
                                </TableCell>
                                <TableCell className={css.tableCell}>
                                    <div className={css.badge}>
                                        {(api.customProperties?.categories as string)?.toLowerCase() || "general"}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default ApisTable;
