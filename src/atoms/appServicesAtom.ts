/* eslint-disable no-restricted-imports */
import { atom } from 'recoil';
import { IApiService } from '@/types/services/IApiService';
import { IAuthService } from '@/types/services/IAuthService';
import ApiService from '@/services/ApiService';
import MsalAuthService from '@/services/MsalAuthService';

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
});

export default appServicesAtom;
