import memoize from 'memoizee';
import { capitalize } from 'lodash';
import {
  ApiSpecReader,
  ApiSpecTypes,
  OperationCategory,
  OperationMetadata,
  RequestMetadata,
  ResponseMetadata,
  SchemaMetadata,
} from '@/types/apiSpec';
import { McpCapabilityTypes, McpOperation, McpSpec, McpTool } from '@/types/mcp';
import { toolDefinitions, toolResponseSchema } from '@/utils/mcp';
import { schemaToTypeLabel } from '@/utils/openApi';

export default async function mcpReader(specStr: string): Promise<ApiSpecReader> {
  const mcpSpec = JSON.parse(specStr) as McpSpec;

  const getBaseUrl = memoize((): string => {
    return mcpSpec.resources[0]?.uri || '/';
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
        operations: mcpSpec[type].map((operation) => ({
          method: '',
          category: type,
          name: `${type}/${operation.name}`,
          displayName: operation.name,
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
        description: metadata.description,
        body: [
          {
            type: 'application/json',
            schema: {
              typeLabel: 'object',
              properties: Object.entries(metadata.inputSchema.properties).map(([name, schema]) => ({
                name,
                in: 'arguments',
                type: schemaToTypeLabel(schema),
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

    throw new Error(`Unsupported operation category: ${operation.category}`);
  });

  const getResponsesMetadata = memoize((operationName: string): ResponseMetadata[] => {
    const operation = getOperation(operationName);

    if (operation.category === McpCapabilityTypes.TOOLS) {
      return [
        {
          body: [
            {
              type: 'application/json',
              schema: toolResponseSchema,
            },
          ],
        },
      ];
    }

    return [];
  });

  const getOperationDefinitions = memoize((operationName: string): SchemaMetadata[] => {
    const operation = getOperation(operationName);

    if (operation.category === McpCapabilityTypes.TOOLS) {
      return toolDefinitions;
    }

    return [];
  });

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
