import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '@fluentui/react-components';
import useApiSpec from '@/hooks/useApiSpec';
import { ApiDefinitionId } from '@/types/apiDefinition';
import ApiOperationsSelect from '@/experiences/ApiOperationsSelect';
import useSelectedOperation from '@/hooks/useSelectedOperation';
import { ApiOperationDetails } from '@/experiences/ApiOperationDetails/ApiOperationDetails';
import styles from './ApiSpec.module.scss';

export const ApiSpec: React.FC = () => {
  const { apiName, versionName, definitionName } = useParams<Readonly<ApiDefinitionId>>() as ApiDefinitionId;
  const { name: selectedOperationName } = useSelectedOperation();

  const definitionId = useMemo<ApiDefinitionId>(
    () => ({ apiName, versionName, definitionName }),
    [apiName, definitionName, versionName]
  );
  const apiSpec = useApiSpec(definitionId);

  function renderContent() {
    if (apiSpec.isLoading) {
      return <Spinner className={styles.spinner} />;
    }

    if (!apiSpec.spec) {
      // TODO: make it more user-friendly
      return <span>API specification not found.</span>;
    }

    return (
      <div className={styles.content}>
        <aside className={styles.operationsList}>
          <h4>Operations</h4>
          <ApiOperationsSelect apiSpec={apiSpec} />
        </aside>
        <div className={styles.details}>
          <ApiOperationDetails apiSpec={apiSpec} operation={apiSpec.getOperation(selectedOperationName)} />
        </div>
      </div>
    );
  }

  return <div className={styles.apiSpec}>{renderContent()}</div>;
};

export default React.memo(ApiSpec);
