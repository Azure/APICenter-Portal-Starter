import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '@fluentui/react-components';
import useApiSpec from '@/hooks/useApiSpec';
import { ApiDefinitionId } from '@/types/apiDefinition';
import OpenApiParser from '@/parsers/openApiParser';
import ApiOperationsSelect from '@/experiences/ApiOperationsSelect';
import styles from './ApiSpec.module.scss';

export const ApiSpec: React.FC = () => {
  const { apiName, versionName, definitionName } = useParams<Readonly<ApiDefinitionId>>() as ApiDefinitionId;

  const definitionId = useMemo<ApiDefinitionId>(
    () => ({ apiName, versionName, definitionName }),
    [apiName, definitionName, versionName]
  );
  const apiSpecification = useApiSpec(definitionId);

  function renderContent() {
    if (apiSpecification.isLoading) {
      return <Spinner className={styles.spinner} />;
    }

    if (!apiSpecification.value) {
      // TODO: make it more user-friendly
      return <span>API specification not found.</span>;
    }

    console.log(apiSpecification.value);

    return (
      <div className={styles.content}>
        <aside className={styles.operationsList}>
          <ApiOperationsSelect apiSpec={apiSpecification.value} />
        </aside>
        <div className={styles.details}></div>
      </div>
    );
  }

  return <div className={styles.apiSpec}>{renderContent()}</div>;
};

export default React.memo(ApiSpec);
