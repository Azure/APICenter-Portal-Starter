import { Buffer } from 'buffer';
import { ResolvedHttpReqData } from 'api-docs-ui';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCodes } from '@/constants/HttpStatusCodes';
import { OperationMetadata } from '@/types/apiSpec';
import { apimFetchProxy } from '@/utils/apimProxy';
import { QueryKeys } from '@/constants/QueryKeys';

interface ResponseType {
  headers: Record<string, string>;
  statusCode: number;
  statusText: string;
  body: Buffer;
}

/**
 * A hook to send HTTP requests from HTTP test console and handle the response.
 */
export function useHttpTestRequestController(operation?: OperationMetadata) {
  return useMutation({
    mutationKey: [QueryKeys.HttpTestMutation, operation],
    mutationFn: async (reqData: ResolvedHttpReqData): Promise<ResponseType | undefined> => {
      try {
        const response = await apimFetchProxy(reqData.url, {
          method: reqData.method,
          headers: Object.fromEntries(reqData.headers.map(({ name, value }) => [name, value])),
          body: reqData.body,
          redirect: 'manual',
        });

        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return {
          headers: responseHeaders,
          statusCode: response.status,
          statusText: response.statusText || HttpStatusCodes[response.status] || 'Unknown',
          body: Buffer.from(await response.arrayBuffer()),
        };
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error(
            'Since the browser initiates the request, it requires Cross-Origin Resource Sharing (CORS) enabled on the server.'
          );
        } else {
          throw new Error('Unable to complete request');
        }
      }
    },
  });
}
