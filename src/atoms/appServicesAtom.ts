/* eslint-disable no-restricted-imports */
import { atom } from 'recoil';
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

const appServicesAtom = atom<AppServicesAtomState>({
  key: 'appServices',
  default: {
    ApiService,
    AuthService: MsalAuthService,
  },
  effects: [
    ({ setSelf, getLoadable }) => {
      // This needs to be run in the next execution frame to allow all atoms to be initialized first
      setTimeout(() => {
        const config = getLoadable(configAtom).contents;
        const isAnonymousAccess = !config?.authentication;
        
        setSelf({
          ApiService,
          AuthService: isAnonymousAccess ? AnonymousAuthService : MsalAuthService,
        });
      });
    },
  ],
});

export default appServicesAtom;
