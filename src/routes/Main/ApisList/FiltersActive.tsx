/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC } from "react";
import { Dismiss12Regular } from "@fluentui/react-icons";

import useFilters, { TFilterTag } from "./Filters/useFilters";

import css from "./index.module.scss";

const FilterTag: FC<{ item: TFilterTag; onClick: () => void }> = ({ item, onClick }) => (
    <div className={css.filterTag}>
        {item.filterType}: <b>{item.label}</b>
        <button title={"Remove"} onClick={onClick}>
            <Dismiss12Regular />
        </button>
    </div>
);

const FiltersActive = () => {
    const [filtersActive, setSearchParams] = useFilters();

    return filtersActive.length === 0 ? (
        <></>
    ) : (
        <div className={css.filtersActive}>
            {filtersActive.map(item => (
                <FilterTag
                    key={item.key}
                    item={item}
                    onClick={() =>
                        setSearchParams(prev => {
                            prev.delete(item.key);
                            return prev;
                        })
                    }
                />
            ))}
            <button onClick={() => setSearchParams()} className={css.filtersClearAll}>
                Clear all
            </button>
        </div>
    );
};

export default FiltersActive;
