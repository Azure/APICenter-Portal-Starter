/* eslint-disable no-restricted-imports */
import { atom, selector, DefaultValue } from 'recoil';
import ApiService from '@/services/ApiService';
import MsalAuthService from '@/services/MsalAuthService';
import AnonymousAuthService from '@/services/AnonymousAuthService';
import { IApiService } from '@/types/services/IApiService';
import { IAuthService } from '@/types/services/IAuthService';
import configAtom from './configAtom';

// If adding more services here - make sure to restrict their default implementations imports in eslint config (no-restricted-imports rule)
export interface AppServicesAtomState {
  ApiService?: IApiService;
  AuthService?: IAuthService;
}

// Store overrides separately so base services can still respond to config changes
const appServicesOverridesAtom = atom<Partial<AppServicesAtomState>>({
  key: 'appServices/overrides',
  default: {},
});

const appServicesAtom = selector<AppServicesAtomState>({
  key: 'appServices',
  get: ({ get }) => {
    const config = get(configAtom);
    const isAnonymousAccess = !config?.authentication;

    const base: AppServicesAtomState = {
      ApiService,
      AuthService: isAnonymousAccess ? AnonymousAuthService : MsalAuthService,
    };

    const overrides = get(appServicesOverridesAtom);
    return { ...base, ...overrides };
  },
  set: ({ set }, newValue) => {
    if (newValue instanceof DefaultValue) {
      set(appServicesOverridesAtom, {});
      return;
    }
    // Accept either full or partial overrides; merge happens in get
    set(appServicesOverridesAtom, newValue as Partial<AppServicesAtomState>);
  },
});

export default appServicesAtom;
