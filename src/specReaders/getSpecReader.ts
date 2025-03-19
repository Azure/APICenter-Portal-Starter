import { ApiSpecReader, ApiSpecReaderFactory } from '@/types/apiSpec';
import openApiV2Reader from '@/specReaders/openApiV2Reader';
import openApiV3Reader from '@/specReaders/openApiV3Reader';
import graphqlReader from '@/specReaders/graphqlReader';
import mcpReader from '@/specReaders/mcpReader';
import { ApiDefinition } from '@/types/apiDefinition';

function getReaderFactory(definition: ApiDefinition): ApiSpecReaderFactory {
  // TODO: change to more appropriate spec name
  if (definition.specification?.name === 'other') {
    return mcpReader;
  }
  if (definition.specification?.name === 'openapi') {
    const version = definition.specification?.version;

    if (version.startsWith('2.')) {
      return openApiV2Reader;
    }

    if (version.startsWith('3.')) {
      return openApiV3Reader;
    }

    throw new Error(`Unknown OpenAPI version [${version}]`);
  }

  if (definition.specification?.name === 'graphql') {
    return graphqlReader;
  }

  throw new Error(`Unsupported API specification type ${definition.specification?.name}`);
}

export default async function getSpecReader(spec: string, definition: ApiDefinition): Promise<ApiSpecReader> {
  return getReaderFactory(definition)(spec);
}
