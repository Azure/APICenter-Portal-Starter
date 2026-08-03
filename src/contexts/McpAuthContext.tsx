import React, { createContext, useContext } from 'react';
import { ApiAuthCredentials } from '@/types/apiAuth';

const McpAuthContext = createContext<ApiAuthCredentials | undefined>(undefined);

interface Props {
  credentials?: ApiAuthCredentials;
  children: React.ReactNode;
}

/**
 * Publishes the credentials the MCP server was connected with, so that consumers rendered
 * below the spec page (e.g. the test console) issue their requests with the same credentials.
 */
export const McpAuthProvider: React.FC<Props> = ({ credentials, children }) => (
  <McpAuthContext.Provider value={credentials}>{children}</McpAuthContext.Provider>
);

export function useMcpAuthCredentials(): ApiAuthCredentials | undefined {
  return useContext(McpAuthContext);
}
