/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useState } from "react";

const SessionContext = createContext<{
    iterator?: number;
    update?: Dispatch<SetStateAction<number>>;
}>({ iterator: 0 });

export const SessionProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [iterator, setIterator] = useState(0);

    return <SessionContext.Provider value={{ update: setIterator, iterator }}>{children}</SessionContext.Provider>;
};

let isSessionAuthenticated = false;

export const useSession = () => {
    const { update } = useContext(SessionContext);

    const isAuthenticated = () => isSessionAuthenticated;

    const setAuthenticated = (value: boolean) => {
        isSessionAuthenticated = value;
        update?.(old => old + 1); // needed to trigger rerender of all subscriptions
    };

    return {
        isAuthenticated: isAuthenticated,
        setAuthenticated: setAuthenticated,
    };
};
