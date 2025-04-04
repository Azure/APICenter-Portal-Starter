import memoize from 'memoizee';
import { capitalize } from 'lodash';
import {
  ApiSpecReader,
  ApiSpecTypes,
  DynamicSchemaMetadata,
  OperationCategory,
  OperationMetadata,
  OperationParameterMetadata,
  OperationTypes,
  RequestMetadata,
  ResponseMetadata,
  SchemaMetadata,
} from '@/types/apiSpec';
import { McpCapabilityTypes, McpOperation, McpPrompt, McpResource, McpSpec, McpTool } from '@/types/mcp';
import { schemaToFieldType, schemaToTypeLabel } from '@/utils/openApi';

const RESOURCE_PROPERTIES = ['uri', 'name', 'description', 'mimeType', 'size'];

const operationTypeByCapabilityType: Record<McpCapabilityTypes, OperationTypes> = {
  [McpCapabilityTypes.TOOLS]: OperationTypes.DEFAULT,
  [McpCapabilityTypes.RESOURCES]: OperationTypes.MCP_RESOURCE,
  [McpCapabilityTypes.PROMPTS]: OperationTypes.DEFAULT,
};

export default async function mcpReader(specStr: string): Promise<ApiSpecReader> {
  const mcpSpec = JSON.parse(specStr) as McpSpec;

  const getBaseUrl = memoize((): string => {
    return '/';
  });

  const getTagLabels = memoize((): string[] => {
    return [];
  });

  const getOperationCategories = memoize((): Array<OperationCategory<McpOperation>> => {
    return Object.values(McpCapabilityTypes)
      .filter((type) => mcpSpec[type].length)
      .map((type) => ({
        name: type,
        label: capitalize(type),
        operations: mcpSpec[type].map((operation: McpOperation) => ({
          type: operationTypeByCapabilityType[type],
          method: '',
          category: type,
          name: `${type}/${operation.name}`,
          displayName: operation.name,
          description: operation.description,
          urlTemplate: '/',
          spec: operation,
        })),
      }));
  });

  const getOperations = memoize((): Array<OperationMetadata<McpOperation>> => {
    return getOperationCategories().flatMap((category) => category.operations);
  });

  const getOperation = memoize((operationName: string): OperationMetadata<McpOperation> | undefined => {
    return getOperations().find((operation) => operation.name === operationName);
  });

  const getRequestMetadata = memoize((operationName: string): RequestMetadata => {
    const operation = getOperation(operationName);

    if (operation.category === McpCapabilityTypes.TOOLS) {
      const metadata = operation.spec as McpTool;

      return {
        body: [
          {
            type: 'application/json',
            schema: {
              typeLabel: 'object',
              properties: Object.entries(metadata.inputSchema.properties).map(([name, schema]) => ({
                name,
                in: 'arguments',
                type: schemaToTypeLabel(schema),
                fieldType: schemaToFieldType(schema),
                description: schema.description,
                required: metadata.inputSchema.required.includes(name),
              })),
              rawSchema: {
                schema: JSON.stringify(metadata.inputSchema, null, 2),
                language: 'json',
              },
            },
          },
        ],
      };
    }

    if (operation.category === McpCapabilityTypes.RESOURCES) {
      const metadata = operation.spec as McpResource;

      return {
        body: [
          {
            type: 'application/json',
            schema: {
              typeLabel: 'object',
              properties: RESOURCE_PROPERTIES.filter((name) => name in metadata).map((name) => ({
                name,
                value: JSON.stringify(metadata[name], null, 2),
              })),
              rawSchema: {
                schema: JSON.stringify(metadata, null, 2),
                language: 'json',
              },
              isStatic: true,
            },
          },
        ],
      };
    }

    if (operation.category === McpCapabilityTypes.PROMPTS) {
      const metadata = operation.spec as McpPrompt;

      return {
        body: [
          {
            type: 'application/json',
            schema: {
              typeLabel: 'object',
              properties: metadata.arguments.map<OperationParameterMetadata>((schema) => ({
                name: schema.name,
                in: 'arguments',
                type: 'string',
                fieldType: 'text',
                description: schema.description,
                required: schema.required,
              })),
              rawSchema: {
                schema: JSON.stringify(metadata.arguments || [], null, 2),
                language: 'json',
              },
            },
          },
        ],
      };
    }

    console.error(`Unsupported operation category: ${operation.category}`);
  });

  const getResponsesMetadata = memoize((): ResponseMetadata[] => []);
  const getOperationDefinitions = memoize((): SchemaMetadata[] => []);

  return {
    type: ApiSpecTypes.MCP,
    getBaseUrl,
    getTagLabels,
    getOperationCategories,
    getOperations,
    getOperation,
    getRequestMetadata,
    getResponsesMetadata,
    getOperationDefinitions,
  };
}
