import { getRecoil } from 'recoil-nexus';
import appServicesAtom from '@/atoms/appServicesAtom';
import configAtom from '@/atoms/configAtom';

const CORS_PROXY_ENDPOINT = 'https://apimanagement-cors-proxy-df.azure-api.net/sendrequest';

export async function apimFetchProxy(url: string, requestInit?: RequestInit): ReturnType<typeof fetch> {
  const { AuthService } = getRecoil(appServicesAtom);
  const config = getRecoil(configAtom);

  const accessToken = await AuthService.getAccessToken();
  const serviceName = config.dataApiHostName.split('.')[0];

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
