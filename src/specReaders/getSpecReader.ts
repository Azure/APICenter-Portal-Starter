import { ApiSpecReader, ApiSpecReaderFactory } from '@/types/apiSpec';
import openApiV2Reader from '@/specReaders/openApiV2Reader';
import openApiV3Reader from '@/specReaders/openApiV3Reader';
import graphqlReader from '@/specReaders/graphqlReader';
import { ApiDefinition } from '@/types/apiDefinition';

function getReaderFactory(definition: ApiDefinition): ApiSpecReaderFactory {
  if (definition.specification?.name === 'openapi') {
    if (definition.specification?.version === '2.0') {
      return openApiV2Reader;
    }
    return openApiV3Reader;
  }

  if (definition.specification?.name === 'graphql') {
    return graphqlReader;
  }

  throw new Error(`Unsupported API specification type ${definition.specification?.name}`);
}

export default async function getSpecReader(spec: string, definition: ApiDefinition): Promise<ApiSpecReader> {
  return getReaderFactory(definition)(spec);
}
