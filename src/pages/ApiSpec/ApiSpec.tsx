import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Spinner } from '@fluentui/react-components';
import { ApiDefinitionId, ResourceType } from '@/types/apiDefinition';
import { useApi } from '@/hooks/useApi';
import { setDocumentTitle } from '@/utils/dom';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ApiDefinitionSelect, { ApiDefinitionSelection } from '@/experiences/ApiDefinitionSelect';
import { LocationsService } from '@/services/LocationsService';
import { ApiDeployment } from '@/types/apiDeployment';
import McpSpecPage from './McpSpecPage';
import DefaultApiSpecPage from './DefaultApiSpecPage';
import styles from './ApiSpec.module.scss';

export const ApiSpec: React.FC = () => {
  const { apiName, versionName, definitionName } = useParams<Readonly<ApiDefinitionId>>() as ApiDefinitionId;
  const location = useLocation();
  const resourceType: ResourceType = location.pathname.startsWith('/languageModels') ? 'languageModels' : 'apis';

  const [deployment, setDeployment] = useState<ApiDeployment | null | undefined>();
  const [resolvedDefinitionName, setResolvedDefinitionName] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // This is needed to avoid unnecessary re-renders caused by new object creation
  const definitionId = useMemo(
    () => ({ apiName, versionName, definitionName: resolvedDefinitionName ?? definitionName, resourceType }),
    [apiName, versionName, definitionName, resolvedDefinitionName, resourceType]
  );

  const api = useApi(definitionId.apiName, resourceType);

  setDocumentTitle(`API Specification${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const handleDefinitionSelectionChange = useCallback(
    (definitionSelection: ApiDefinitionSelection) => {
      setDeployment(definitionSelection.deployment);

      if (!definitionSelection.version || !definitionSelection.definition) {
        return;
      }

      setResolvedDefinitionName(definitionSelection.definition.name);

      if (
        definitionSelection.version.name === versionName &&
        definitionSelection.definition.name === definitionName
      ) {
        return;
      }

      const url = LocationsService.getApiSchemaExplorerUrl(
          apiName,
          definitionSelection.version.name,
          definitionSelection.definition.name,
          resourceType,
        );
      if (url) {
        navigate(url, { replace: true });
      }
    },
    [apiName, versionName, definitionName, navigate, resourceType]
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
              resourceType={resourceType}
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
    if (api.isLoading || deployment === undefined || !resolvedDefinitionName) {
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
