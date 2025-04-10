import { ApiSpecReader, OperationMetadata } from '@/types/apiSpec';
import { ApiDeployment } from '@/types/apiDeployment';
import { ApiDefinitionId } from '@/types/apiDefinition';

export interface OperationDetailsViewProps {
  definitionId: ApiDefinitionId;
  apiSpec: ApiSpecReader;
  operation?: OperationMetadata;
  deployment?: ApiDeployment;
}
