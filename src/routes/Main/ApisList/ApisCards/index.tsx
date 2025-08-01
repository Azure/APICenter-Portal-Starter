/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC } from "react";
import { useNavigate } from "react-router-dom";

import { Api } from "../../../../contracts/api";
import AzureIcon from "../../../../media/AzureIcon.svg";

import css from "./index.module.scss";

const ApiCard: FC<{ api: Api }> = ({ api }) => {
    const navigate = useNavigate();
    const iconUrl = api.customProperties?.icon as string;

    return (
        <button
            className={css.apiCard}
            onClick={() => navigate("detail/" + api.name + window.location.search)}
            role={"link"}
            aria-label={`View details for ${api.title}`}
        >
            <div className={css.content}>
                <div className={css.headerSection}>
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
                    <div className={css.contentRight}>
                        <div className={css.tags}>
                            <span>{api.kind?.toLowerCase()}</span>
                            {api.customProperties?.type ? (
                                <span>{(api.customProperties.type as string).toLowerCase()}</span>
                            ) : null}
                        </div>
                        <div className={css.titleRow}>
                            <h4>{api.title}</h4>
                        </div>
                    </div>
                </div>
                <p className={css.description}>{api.description}</p>
            </div>
        </button>
    );
};

const ApisCards: FC<{ apis: Api[] | null }> = ({ apis }) => {
    return <div className={css.container}>{apis?.map(api => <ApiCard key={api.name} api={api} />)}</div>;
};

export default ApisCards;
