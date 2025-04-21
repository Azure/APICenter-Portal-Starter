import { FilterMetadata, FilterType } from '@/types/apiFilters';

export const ApiFilterParameters: Record<FilterType, FilterMetadata> = {
  kind: {
    label: 'API type',
    options: [
      { value: 'rest', label: 'REST' },
      { value: 'mcp', label: 'MCP' },
      { value: 'graphql', label: 'GraphQL' },
      { value: 'grpc', label: 'gRPC' },
      { value: 'soap', label: 'SOAP' },
      { value: 'webhook', label: 'Webhook' },
      { value: 'websocket', label: 'WebSocket' }
    ],
  },
  lifecycleStage: {
    label: 'Lifecycle',
    options: [
      { value: 'design', label: 'Design' },
      { value: 'development', label: 'Development' },
      { value: 'testing', label: 'Testing' },
      { value: 'preview', label: 'Preview' },
      { value: 'production', label: 'Production' },
      { value: 'deprecated', label: 'Deprecated' },
      { value: 'retired', label: 'Retired' },
    ],
  },
};
