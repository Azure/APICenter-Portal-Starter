/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    Link,
} from "@fluentui/react-components";

import { LocalStorageKey, useLocalStorage } from "../../util/useLocalStorage";
import Lock from "../logos/Lock";

import css from "./index.module.scss";

const RestrictedAccessModal = () => {
    const isRestricted = useLocalStorage(LocalStorageKey.isRestricted);

    return (
        <Dialog open>
            <DialogSurface>
                <DialogBody>
                    <DialogContent>
                        <div className={css.restrictedContent}>
                            <Lock />
                            <div>
                                You are not authorized to access this portal. Please contact the portal administrator
                                for assistance. See{" "}
                                <Link
                                    href={
                                        "https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal?tabs=delegate-condition"
                                    }
                                    target={"_blank"}
                                >
                                    documentation
                                </Link>{" "}
                                for further details.
                            </div>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            appearance={"secondary"}
                            onClick={() => {
                                isRestricted.set("false");
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};

export default RestrictedAccessModal;
