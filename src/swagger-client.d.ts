/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'swagger-client' {
  import { OpenAPI } from 'openapi-types';

  interface SwaggerClientOptions {
    url?: string;
    spec?: OpenAPI.Document;
  }

  interface ResolveResult {
    spec: OpenAPI.Document;
    errors: any[];
  }

  export default class SwaggerClient {
    constructor(options: SwaggerClientOptions);

    static resolve(options: SwaggerClientOptions): Promise<ResolveResult>;
  }
}
