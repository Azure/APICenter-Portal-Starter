/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useMemo } from "react";
import { Accordion, Divider } from "@fluentui/react-components";

import { ApiFilters } from "../../../../constants";
import { TOption } from "../../../../types";
import FilterSection from "./FilterSection";

import css from "./index.module.scss";

interface FiltersProps {
    filterOptions: {
        categories: TOption[];
        vendors: TOption[];
        endpoint: TOption[];
        types: TOption[];
    };
}

const Filters: React.FC<FiltersProps> = ({ filterOptions }) => {
    const filters = useMemo(() => {
        const updatedFilters = { ...ApiFilters };
        updatedFilters.categories.options = filterOptions.categories;
        updatedFilters.vendors.options = filterOptions.vendors;
        updatedFilters.endpoint.options = filterOptions.endpoint;
        updatedFilters.types.options = filterOptions.types;
        return updatedFilters;
    }, [filterOptions]);

    const visibleFilters = useMemo(() => {
        return Object.entries(filters).filter(([_, value]) => value.visible !== false);
    }, [filters]);

    return (
        <section className={css.filters}>
            <h3>Filter by</h3>

            <Accordion multiple className={css.accordion} defaultOpenItems={visibleFilters.map(([key]) => key)}>
                {visibleFilters.map(([key, value], index) => (
                    <React.Fragment key={key}>
                        <FilterSection filterKey={key} label={value.label} options={value.options} />
                        {index !== visibleFilters.length - 1 && <Divider className={css.divider} />}
                    </React.Fragment>
                ))}
            </Accordion>
        </section>
    );
};

export default Filters;
