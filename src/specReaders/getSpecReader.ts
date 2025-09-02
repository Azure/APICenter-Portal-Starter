import * as yaml from 'yaml';
import { ApiSpecReader } from '@/types/apiSpec';
import { openApiV2Reader } from '@/specReaders/openApiV2Reader';
import { openApiV3Reader } from '@/specReaders/openApiV3Reader';
import { graphqlReader } from '@/specReaders/graphqlReader';
import { mcpReader } from '@/specReaders/mcpReader';
import { ApiDefinition } from '@/types/apiDefinition';

export async function getSpecReader(spec: string, definition: ApiDefinition): Promise<ApiSpecReader> {
  switch (definition.specification?.name) {
    case 'mcp':
      return mcpReader(spec);

    case 'graphql':
      return graphqlReader(spec);

    case 'openapi': {
      let version = definition.specification?.version;
      if (!version) {
        const specJson = yaml.parse(spec);
        version = specJson.openapi || specJson.swagger;
      }

      if (version.startsWith('2.')) {
        return openApiV2Reader(spec);
      }

      if (version.startsWith('3.')) {
        return openApiV3Reader(spec);
      }

      throw new Error(`Unknown OpenAPI version [${version}]`);
    }

    default:
      throw new Error(`Unsupported API specification type ${definition.specification?.name}`);
  }
}
