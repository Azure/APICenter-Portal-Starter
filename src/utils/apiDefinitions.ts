import { ApiDefinitionId } from '@/types/apiDefinition';

export function isDefinitionIdValid(definitionId: ApiDefinitionId): boolean {
  return Boolean(definitionId.apiName && definitionId.versionName && definitionId.definitionName);
}
