import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '@fluentui/react-components';
import { ApiDefinitionId } from '@/types/apiDefinition';
import useApi from '@/hooks/useApi';
import { setDocumentTitle } from '@/utils/dom';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ApiDefinitionSelect, { ApiDefinitionSelection } from '@/experiences/ApiDefinitionSelect';
import LocationsService from '@/services/LocationsService';
import { ApiDeployment } from '@/types/apiDeployment';
import McpSpecPage from './McpSpecPage';
import DefaultApiSpecPage from './DefaultApiSpecPage';
import styles from './ApiSpec.module.scss';

export const ApiSpec: React.FC = () => {
  const { apiName, versionName, definitionName } = useParams<Readonly<ApiDefinitionId>>() as ApiDefinitionId;

  const [deployment, setDeployment] = useState<ApiDeployment | null | undefined>();
  const navigate = useNavigate();

  // This is needed to avoid unnecessary re-renders caused by new object creation
  const definitionId = useMemo(
    () => ({ apiName, versionName, definitionName }),
    [apiName, versionName, definitionName]
  );

  const api = useApi(definitionId.apiName);

  setDocumentTitle(`API Specification${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const handleDefinitionSelectionChange = useCallback(
    (definitionSelection: ApiDefinitionSelection) => {
      setDeployment(definitionSelection.deployment);

      if (
        definitionSelection.version.name === definitionId.versionName &&
        definitionSelection.definition.name === definitionId.definitionName
      ) {
        return;
      }

      navigate(
        LocationsService.getApiSchemaExplorerUrl(
          definitionId.apiName,
          definitionSelection.version.name,
          definitionSelection.definition.name
        )
      );
    },
    [definitionId, navigate]
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
              apiId={definitionId.apiName}
              defaultSelection={{
                version: definitionId.versionName,
                definition: definitionId.definitionName,
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
    if (api.isLoading || deployment === undefined) {
      return <Spinner className={styles.spinner} />;
    }

    if (api.data.kind === 'mcp') {
      return <McpSpecPage definitionId={definitionId} deployment={deployment} />;
    }

    return <DefaultApiSpecPage definitionId={definitionId} deployment={deployment} />;
  }

  return (
    <div className={styles.apiSpec}>
      {renderHeader()}
      <section>{renderContent()}</section>
    </div>
  );
};

export default React.memo(ApiSpec);
