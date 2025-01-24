export enum Method {
  GET = 'GET',
  POST = 'POST',
}
export interface IHttpClient {
  fetchData(url: string, method: Method): Promise<any>;
}
