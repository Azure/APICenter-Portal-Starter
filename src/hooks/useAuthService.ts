import { useRecoilValue } from 'recoil';
import appServicesAtom from '@/atoms/appServicesAtom';
import { IAuthService } from '@/types/services/IAuthService';

export default function useAuthService(): IAuthService {
  const { AuthService } = useRecoilValue(appServicesAtom);
  return AuthService;
}
