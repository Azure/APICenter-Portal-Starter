import { useRecoilValue } from 'recoil';
import appServicesAtom from '@/atoms/appServicesAtom';
import { IApiService } from '@/types/services/IApiService';

export default function useApiService(): IApiService {
  const { ApiService } = useRecoilValue(appServicesAtom);
  return ApiService;
}
