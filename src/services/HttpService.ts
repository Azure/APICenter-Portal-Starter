/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRecoil, setRecoil } from 'recoil-nexus';
import memoizee from 'memoizee';
import { isAccessDeniedAtom } from '@/atoms/isAccessDeniedAtom';
import { appServicesAtom } from '@/atoms/appServicesAtom';
import { configAtom } from '@/atoms/configAtom';

const BASE_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

interface RequestOptions {
  /** If true, skip adding the /workspaces/default prefix to the URL */
  skipWorkspacePrefix?: boolean;
}

async function makeRequest<T>(
  endpoint: string,
  method: string,
  payload?: any,
  options?: RequestOptions
): Promise<T> {
  const { AuthService } = getRecoil(appServicesAtom);
  const config = getRecoil(configAtom);
  const accessToken = await AuthService.getAccessToken();

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

  let baseUrl = `https://${config.dataApiHostName}`;

  // Append the default workspace to the base URL if it's not already there
  // unless skipWorkspacePrefix is set
  if (!options?.skipWorkspacePrefix && !config.dataApiHostName.includes('/workspaces/default')) {
    baseUrl += '/workspaces/default';
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

export const HttpService = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T | undefined> {
    return makeRequestWithCache<T>(endpoint, 'GET', undefined, options);
  },

  /** Fetch a fully-qualified URL (e.g. a nextLink returned by the Data API). */
  async getByUrl<T>(url: string): Promise<T | undefined> {
    const { AuthService } = getRecoil(appServicesAtom);
    const accessToken = await AuthService.getAccessToken();

    const init: RequestInit = {
      method: 'GET',
      headers: new Headers(BASE_HEADERS),
    };

    if (accessToken) {
      (init.headers as Headers).append('Authorization', 'Bearer ' + accessToken);
    }

    const response = await fetch(url, init);

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
  },

  /** GET that returns `undefined` on 404 instead of throwing / returning error JSON. */
  async getOptional<T>(endpoint: string, options?: RequestOptions): Promise<T | undefined> {
    try {
      const { AuthService } = getRecoil(appServicesAtom);
      const config = getRecoil(configAtom);
      const accessToken = await AuthService.getAccessToken();

      const init: RequestInit = {
        method: 'GET',
        headers: new Headers(BASE_HEADERS),
      };

      if (accessToken) {
        (init.headers as Headers).append('Authorization', 'Bearer ' + accessToken);
      }

      let baseUrl = `https://${config.dataApiHostName}`;
      if (!options?.skipWorkspacePrefix && !config.dataApiHostName.includes('/workspaces/default')) {
        baseUrl += '/workspaces/default';
      }

      const response = await fetch(`${baseUrl}${endpoint}`, init);

      if (response.status === 404) return undefined;

      if (response.status === 401 || response.status === 403) {
        if (accessToken) {
          setRecoil(isAccessDeniedAtom, true);
          return undefined;
        }
      }

      return (await response.json()) as T;
    } catch {
      return undefined;
    }
  },

  post<T>(endpoint: string, payload?: any): Promise<T | undefined> {
    return makeRequest<T>(endpoint, 'POST', payload);
  },
};
