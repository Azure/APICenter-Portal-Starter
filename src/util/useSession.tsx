/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthService } from '@/util/useAuthService.ts';

interface SessionCtx {
  isAuthenticated: boolean;
  setIsAuthenticated: (state: boolean) => void;
}

const SessionContext = createContext<SessionCtx>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authService = useAuthService();

  useEffect(() => {
    authService.isAuthenticated().then(setIsAuthenticated);
  }, [authService]);

  return <SessionContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  return useContext(SessionContext);
};
