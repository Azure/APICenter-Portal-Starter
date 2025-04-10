import React from 'react';
import ApiOperationDetails from '@/experiences/ApiOperationDetails';
import ApiOperationsSelect from '@/experiences/ApiOperationsSelect';
import EmptyStateMessage from '@/components/EmptyStateMessage';
import { ApiDeployment } from '@/types/apiDeployment';
import useSelectedOperation from '@/hooks/useSelectedOperation';
import { ApiSpecReader } from '@/types/apiSpec';
import { ApiDefinitionId } from '@/types/apiDefinition';
import styles from './ApiSpecPageLayout.module.scss';

interface Props {
  definitionId: ApiDefinitionId;
  deployment: ApiDeployment;
  apiSpec?: ApiSpecReader;
}

export const ApiSpecPageLayout: React.FC<Props> = ({ definitionId, deployment, apiSpec }) => {
  const selectedOperation = useSelectedOperation();

  if (!apiSpec?.type) {
    return (
      <EmptyStateMessage>The specified API does not exist or its documentation can&apos;t be displayed.</EmptyStateMessage>
    );
  }

  return (
    <div className={styles.apiSpecPageLayout}>
      <aside className={styles.operationsList}>
        <ApiOperationsSelect apiSpec={apiSpec} />
      </aside>

      <div className={styles.details}>
        <ApiOperationDetails
          definitionId={definitionId}
          deployment={deployment}
          apiSpec={apiSpec}
          operation={apiSpec.getOperation(selectedOperation.name)}
        />
      </div>
    </div>
  );
};

export default React.memo(ApiSpecPageLayout);
