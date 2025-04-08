import { getRecoil } from 'recoil-nexus';
import appServicesAtom from '@/atoms/appServicesAtom';

const CORS_PROXY_ENDPOINT = 'https://apimanagement-cors-proxy-df.azure-api.net/sendrequest';

export async function apimFetchProxy(url: string, requestInit?: RequestInit): ReturnType<typeof fetch> {
  const { AuthService, ConfigService } = getRecoil(appServicesAtom);
  const accessToken = await AuthService.getAccessToken();
  const settings = await ConfigService.getSettings();
  const serviceName = settings.dataApiHostName.split('.')[0];

  return fetch(CORS_PROXY_ENDPOINT, {
    ...requestInit,
    method: 'POST',
    headers: {
      ...requestInit?.headers,
      'Ocp-Apim-Authorization': `Bearer ${accessToken}`,
      'Ocp-Apim-Service-Name': serviceName,
      'Ocp-Apim-Method': requestInit?.method || 'GET',
      'Ocp-Apim-Url': url,
    },
  });
}
