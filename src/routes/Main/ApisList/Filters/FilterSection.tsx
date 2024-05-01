/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC } from "react";
import { useSearchParams } from "react-router-dom";
import { AccordionHeader, AccordionItem, AccordionPanel, Checkbox } from "@fluentui/react-components";

import { TOption } from "../../../../types";

const FilterSection: FC<{ filterKey: string; label: string; options: TOption[] }> = ({ filterKey, label, options }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    return (
        <AccordionItem value={filterKey}>
            <AccordionHeader expandIconPosition={"end"}>
                <h3>{label}</h3>
            </AccordionHeader>
            <AccordionPanel>
                {options.map(o => (
                    <div key={o.value}>
                        <Checkbox
                            label={o.label}
                            checked={searchParams.get(`${filterKey}.${o.value}`) === "true"}
                            onChange={(_, active) =>
                                setSearchParams(prev => {
                                    if (active.checked) prev.set(`${filterKey}.${o.value}`, "true");
                                    else prev.delete(`${filterKey}.${o.value}`);
                                    return prev;
                                })
                            }
                        />
                    </div>
                ))}
            </AccordionPanel>
        </AccordionItem>
    );
};

export default FilterSection;
