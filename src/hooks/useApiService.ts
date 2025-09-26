import { useRecoilValue } from 'recoil';
import { appServicesAtom } from '@/atoms/appServicesAtom';
import { IApiService } from '@/types/services/IApiService';

export function useApiService(): IApiService {
  const { ApiService } = useRecoilValue(appServicesAtom);
  return ApiService;
}
