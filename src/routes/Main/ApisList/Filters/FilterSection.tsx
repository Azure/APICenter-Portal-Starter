/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC } from "react";
import { useSearchParams } from "react-router-dom";
import { AccordionHeader, AccordionItem, AccordionPanel, Checkbox, Tooltip } from "@fluentui/react-components";
import { Info16Regular } from "@fluentui/react-icons";

import { TOption } from "../../../../types";

const FilterSection: FC<{ filterKey: string; label: string; options: TOption[] }> = ({ filterKey, label, options }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const renderHeaderWithTooltip = () => {
        if (filterKey === "endpoint") {
            return (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h3>{label}</h3>
                    <Tooltip
                        content={
                            "Some of our remote MCP servers proxy through an Azure API Management (AI Gateway) service to demonstrate enterprise best practices for monitoring, securing, and governing your endpoints."
                        }
                        relationship={"description"}
                    >
                        <Info16Regular style={{ color: "#0078d4", cursor: "help" }} />
                    </Tooltip>
                </div>
            );
        }
        return <h3>{label}</h3>;
    };

    return (
        <AccordionItem value={filterKey}>
            <AccordionHeader expandIconPosition={"end"}>{renderHeaderWithTooltip()}</AccordionHeader>
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
