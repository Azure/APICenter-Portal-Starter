import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '@fluentui/react-components';
import useApiSpec from '@/hooks/useApiSpec';
import { ApiDefinitionId } from '@/types/apiDefinition';
import ApiOperationsSelect from '@/experiences/ApiOperationsSelect';
import useSelectedOperation from '@/hooks/useSelectedOperation';
import ApiOperationDetails from '@/experiences/ApiOperationDetails';
import useApi from '@/hooks/useApi';
import { ApiDeployment } from '@/types/apiDeployment';
import { setDocumentTitle } from '@/utils/dom';
import LocationsService from '@/services/LocationsService';
import ApiDefinitionSelect, { ApiDefinitionSelection } from '@/experiences/ApiDefinitionSelect';
import EmptyStateMessage from '@/components/EmptyStateMessage';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from './ApiSpec.module.scss';

export const ApiSpec: React.FC = () => {
  const { apiName, versionName, definitionName } = useParams<Readonly<ApiDefinitionId>>() as ApiDefinitionId;
  const [deployment, setDeployment] = useState<ApiDeployment | null | undefined>();
  const selectedOperation = useSelectedOperation();
  const navigate = useNavigate();

  const api = useApi(apiName);

  setDocumentTitle(`API Specification${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const definitionId = useMemo<ApiDefinitionId>(
    () => ({ apiName, versionName, definitionName }),
    [apiName, definitionName, versionName]
  );
  const apiSpec = useApiSpec(definitionId);

  const handleDefinitionSelectionChange = useCallback(
    (definitionSelection: ApiDefinitionSelection) => {
      setDeployment(definitionSelection.deployment);

      if (definitionSelection.version.name === versionName && definitionSelection.definition.name === definitionName) {
        return;
      }

      navigate(
        LocationsService.getApiSchemaExplorerUrl(
          apiName,
          definitionSelection.version.name,
          definitionSelection.definition.name
        )
      );
    },
    [apiName, definitionName, navigate, versionName]
  );

  function renderHeader() {
    if (api.isLoading || !api.data) {
      return null;
    }

    return (
      <div className={styles.header}>
        <section>
          <h1>{api.data.title}</h1>
          <MarkdownRenderer markdown={api.data.summary} />

          <div className={styles.definitionRow}>
            <ApiDefinitionSelect
              apiId={apiName}
              defaultSelection={{
                version: versionName,
                definition: definitionName,
              }}
              hiddenSelects={['definition', 'deployment']}
              isInline
              onSelectionChange={handleDefinitionSelectionChange}
            />
          </div>
        </section>
      </div>
    );
  }

  function renderContent() {
    if (apiSpec.isLoading || deployment === undefined) {
      return <Spinner className={styles.spinner} />;
    }

    if (!apiSpec.spec) {
      return (
        <EmptyStateMessage>The specified API does not exist or its specification can&apos;t be read</EmptyStateMessage>
      );
    }

    return (
      <div className={styles.content}>
        <aside className={styles.operationsList}>
          <ApiOperationsSelect apiSpec={apiSpec} />
        </aside>

        <div className={styles.details}>
          <ApiOperationDetails
            apiName={apiName}
            versionName={versionName}
            deployment={deployment}
            apiSpec={apiSpec}
            operation={apiSpec.getOperation(selectedOperation.name)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.apiSpec}>
      {renderHeader()}
      <section>{renderContent()}</section>
    </div>
  );
};

export default React.memo(ApiSpec);
