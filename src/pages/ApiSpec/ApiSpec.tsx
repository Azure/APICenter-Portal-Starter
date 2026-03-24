import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { Badge, Spinner, Tab, TabList } from '@fluentui/react-components';
import { DocumentRegular } from '@fluentui/react-icons';
import { formatKindDisplay } from '@/utils/formatKind';
import { ApiDefinitionId, ResourceType } from '@/types/apiDefinition';
import { useApi } from '@/hooks/useApi';
import { setDocumentTitle } from '@/utils/dom';
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
      <section className={styles.header}>
        <h1>{api.data.title}</h1>
        {(api.data.kind || api.data.lifecycleStage) && (
          <div className={styles.badges}>
            {api.data.kind && <Badge appearance="filled" color="brand">{formatKindDisplay(api.data.kind)}</Badge>}
            {api.data.lifecycleStage && <Badge appearance="outline">{api.data.lifecycleStage}</Badge>}
          </div>
        )}
        {api.data.summary && <p className={styles.summary}>{api.data.summary}</p>}

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
      <section className={styles.tabBar}>
        <TabList defaultSelectedValue="documentation">
          <Tab icon={<DocumentRegular />} value="documentation">Documentation</Tab>
        </TabList>
      </section>
      <section>{renderContent()}</section>
    </div>
  );
};

export default React.memo(ApiSpec);
