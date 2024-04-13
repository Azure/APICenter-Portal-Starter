/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from "react";
import { Accordion, Divider } from "@fluentui/react-components";

import { ApiFilters } from "../../../../constants";
import FilterSection from "./FilterSection";

import css from "./index.module.scss";

const Filters = () => {
    return (
        <section className={css.filters}>
            <h3>Filter by</h3>

            <Accordion multiple className={css.accordion} defaultOpenItems={Object.keys(ApiFilters)}>
                {Object.entries(ApiFilters).map(([key, value], index) => (
                    <React.Fragment key={key}>
                        <FilterSection filterKey={key} label={value.label} options={value.options} />
                        {index !== Object.entries(ApiFilters).length - 1 && <Divider className={css.divider} />}
                    </React.Fragment>
                ))}
            </Accordion>
        </section>
    );
};

export default Filters;
