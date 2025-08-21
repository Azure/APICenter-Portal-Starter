/* eslint-disable no-restricted-imports */
import { selector } from 'recoil';
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

const appServicesAtom = selector<AppServicesAtomState>({
  key: 'appServices',
  get: ({ get }) => {
    const config = get(configAtom);
    const isAnonymousAccess = !config?.authentication;
    
    return {
      ApiService,
      AuthService: isAnonymousAccess ? AnonymousAuthService : MsalAuthService,
    };
  },
});

export default appServicesAtom;
