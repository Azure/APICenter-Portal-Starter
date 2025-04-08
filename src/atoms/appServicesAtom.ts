/* eslint-disable no-restricted-imports */
import { atom } from 'recoil';
import ApiService from '@/services/ApiService';
import { ConfigService } from '@/services/ConfigService';
import { IConfigService } from '@/services/IConfigService';
import MsalAuthService from '@/services/MsalAuthService';
import { IApiService } from '@/types/services/IApiService';
import { IAuthService } from '@/types/services/IAuthService';

// If adding more services here - make sure to restrict their default implementations imports in eslint config (no-restricted-imports rule)
export interface AppServicesAtomState {
  ApiService?: IApiService;
  AuthService?: IAuthService;
  ConfigService?: IConfigService;
}

const appServicesAtom = atom<AppServicesAtomState>({
  key: 'appServices',
  default: {
    ApiService,
    AuthService: MsalAuthService,
    ConfigService: new ConfigService(),
  },
});

export default appServicesAtom;
