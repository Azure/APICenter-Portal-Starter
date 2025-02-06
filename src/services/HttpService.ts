/* eslint-disable @typescript-eslint/no-explicit-any */
import { setRecoil } from 'recoil-nexus';
import memoizee from 'memoizee';
import config from '@/config';
import isAccessDeniedAtom from '@/atoms/isAccessDeniedAtom';
import MsalAuthService from '@/services/MsalAuthService';

let baseUrl = `https://${config.dataApiHostName}`;

// Append the default workspace to the base URL if it's not already there
if (!config.dataApiHostName.includes('/workspaces/default')) {
  baseUrl += '/workspaces/default';
}

const BASE_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

async function makeRequest<T>(endpoint: string, method: string, payload?: any): Promise<T> {
  const accessToken = await MsalAuthService.getAccessToken();

  const init: RequestInit = {
    method,
    headers: new Headers(BASE_HEADERS),
  };

  if (accessToken) {
    (init.headers as Headers).append('Authorization', 'Bearer ' + accessToken);
  }

  if (payload) {
    init.body = JSON.stringify(payload);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, init);

  switch (response.status) {
    case 401:
    case 403:
      if (accessToken) {
        setRecoil(isAccessDeniedAtom, true);
        return;
      }
      break;
  }

  return (await response.json()) as T;
}

const makeRequestWithCache = memoizee(makeRequest);

const HttpService = {
  get<T>(endpoint: string): Promise<T | undefined> {
    return makeRequestWithCache<T>(endpoint, 'GET');
  },

  post<T>(endpoint: string, payload?: any): Promise<T | undefined> {
    return makeRequest<T>(endpoint, 'POST', payload);
  },
};

export default HttpService;
