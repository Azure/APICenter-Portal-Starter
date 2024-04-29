/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC, useEffect } from "react";
import { Dropdown, Option } from "@fluentui/react-components";

import { SortingOptions, TableColumns } from "../../../constants";
import { Api } from "../../../contracts/api";
import { LocalStorageKey, useLocalStorage } from "../../../util/useLocalStorage";
import LayoutSwitch from "./LayoutSwitch";

import css from "./index.module.scss";

const FirstRow: FC<{ apis: Api[] | null }> = ({ apis }) => {
    const localStorageSortBy = useLocalStorage(LocalStorageKey.apiListSortBy);
    const sortBy = localStorageSortBy.get();
    const apisCount = apis?.length ?? 0;

    useEffect(() => {
        if (!sortBy) {
            localStorageSortBy.set(TableColumns[0].value);
        }
    });

    return (
        <div className={css.firstRow}>
            {apisCount === 0 ? (
                <p>
                    Displaying <b>0</b> items
                </p>
            ) : (
                <p>
                    Displaying <b>1</b> to <b>{apisCount}</b> of <b>{apisCount}</b> items
                </p>
            )}

            <div className={css.controls}>
                <div className={css.sortBy}>
                    <label htmlFor={"sortBy"}>Sort by</label>
                    <Dropdown
                        id={"sortBy"}
                        value={sortBy ? SortingOptions.find(o => o.value === sortBy)?.label : ""}
                        selectedOptions={sortBy ? [sortBy] : []}
                        onOptionSelect={(_, { optionValue }) => localStorageSortBy.set(optionValue)}
                    >
                        {SortingOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Dropdown>
                </div>

                <LayoutSwitch />
            </div>
        </div>
    );
};

export default FirstRow;
