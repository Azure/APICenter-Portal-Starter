/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuList, MenuPopover, MenuTrigger, Tooltip } from "@fluentui/react-components";
import {
    CheckmarkCircle12Regular,
    LinkRegular,
    MailRegular,
    MoreHorizontalRegular,
    ShareRegular,
} from "@fluentui/react-icons";

import VsCodeLogo from "../../../../components/logos/VsCodeLogo";
import { Api } from "../../../../contracts/api";

import css from "./index.module.scss";

const ShareSubmenu: FC<{ shareLink: string; onLinkCopy: (isCopied: boolean) => void }> = ({
    shareLink,
    onLinkCopy,
}) => (
    <Menu onOpenChange={e => e.stopPropagation()}>
        <MenuTrigger disableButtonEnhancement>
            <MenuItem icon={<ShareRegular />}>Share</MenuItem>
        </MenuTrigger>

        <MenuPopover>
            <MenuList>
                <MenuItem
                    icon={<MailRegular />}
                    onClick={e => {
                        e.stopPropagation();
                        window.open(`mailto:?body=` + shareLink);
                    }}
                >
                    Email
                </MenuItem>
                <MenuItem
                    icon={<LinkRegular />}
                    onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(shareLink);
                        onLinkCopy(true);
                    }}
                >
                    Copy link
                </MenuItem>
            </MenuList>
        </MenuPopover>
    </Menu>
);

const ApiCard: FC<{ api: Api }> = ({ api }) => {
    const navigate = useNavigate();
    const [isCopied, setIsCopied] = useState<boolean>(false);

    return (
        <Tooltip
            content={
                <div className={css.copiedTooltip}>
                    <CheckmarkCircle12Regular />
                    Copied to clipboard
                </div>
            }
            relationship={"description"}
            visible={isCopied}
            positioning={"after-bottom"}
            onVisibleChange={() => setTimeout(() => setIsCopied(false), 5000)}
        >
            <div className={css.apiCard} onClick={() => navigate("detail/" + api.name + window.location.search)}>
                <div className={css.content}>
                    {!!api.kind && (
                        <div className={css.tags}>
                            <span>API</span>
                            <span>{api.kind}</span>
                        </div>
                    )}
                    <h4>{api.title}</h4>
                    <p className={css.description}>{api.description}</p>
                </div>

                <Menu onOpenChange={e => e.stopPropagation()}>
                    <MenuTrigger disableButtonEnhancement>
                        <Tooltip content={"More actions"} relationship={"description"} hideDelay={0}>
                            <MenuButton
                                appearance={"transparent"}
                                icon={<MoreHorizontalRegular />}
                                className={css.menuButton}
                            />
                        </Tooltip>
                    </MenuTrigger>

                    <MenuPopover>
                        <MenuList>
                            <MenuItem
                                icon={<VsCodeLogo />}
                                onClick={e => {
                                    e.stopPropagation();
                                    window.open(`vscode:extension/apidev.azure-api-center`);
                                }}
                            >
                                Open in Visual Studio Code
                            </MenuItem>
                            <ShareSubmenu
                                shareLink={window.location.href + "detail/" + api.name + window.location.search}
                                onLinkCopy={setIsCopied}
                            />
                        </MenuList>
                    </MenuPopover>
                </Menu>
            </div>
        </Tooltip>
    );
};

const ApisCards: FC<{ apis: Api[] | null }> = ({ apis }) => {
    return <div className={css.container}>{apis?.map(api => <ApiCard key={api.name} api={api} />)}</div>;
};

export default ApisCards;
