import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@fluentui/react-components';
import { useApi } from '@/hooks/useApi';
import { kindToResourceType } from '@/types/apiDefinition';
import { setDocumentTitle } from '@/utils/dom';
import { DetailPageLayout } from '@/components/DetailPageLayout/DetailPageLayout';
import ApiDefinitionSelect, { ApiDefinitionSelection } from '@/experiences/ApiDefinitionSelect';
import ApiInfoOptions from '@/experiences/ApiInfoOptions';
import ApiAdditionalInfo from '@/experiences/ApiAdditionalInfo';
import { formatKindDisplay } from '@/utils/formatKind';

export const ApiDetailPage: React.FC = () => {
  const { apiName } = useParams<{ apiName: string }>();
  const api = useApi(apiName);
  const [definitionSelection, setDefinitionSelection] = useState<ApiDefinitionSelection | undefined>();

  setDocumentTitle(`API${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const kind = api.data?.kind;
  const hiddenSelects = ['mcp', 'skill', 'plugin'].includes(kind ?? '')
    ? (['definition', 'deployment'] as Array<keyof ApiDefinitionSelection>)
    : [];

  return (
    <DetailPageLayout
      title={api.data?.title}
      summary={api.data?.summary}
      metadata={
        <>
          {api.data?.lastUpdated && <span>Last updated {new Date(api.data.lastUpdated).toLocaleDateString()}</span>}
          {api.data?.lifecycleStage && (
            <Badge appearance="tint" color="informative" shape="rounded">
              {api.data.lifecycleStage}
            </Badge>
          )}
          {kind && (
            <Badge appearance="outline" shape="rounded">
              {formatKindDisplay(kind)}
            </Badge>
          )}
        </>
      }
      selector={
        apiName && api.data ? (
          <ApiDefinitionSelect
            apiId={apiName}
            resourceType={kindToResourceType(api.data.kind)}
            hiddenSelects={hiddenSelects}
            isInline
            onSelectionChange={setDefinitionSelection}
          />
        ) : undefined
      }
      isLoading={api.isLoading}
      emptyMessage={!api.isLoading && !api.data ? 'The specified API does not exist.' : undefined}
      sidebar={api.data ? <ApiAdditionalInfo api={api.data} /> : undefined}
    >
      {api.data && (
        <ApiInfoOptions
          api={api.data}
          apiVersion={definitionSelection?.version}
          apiDefinition={definitionSelection?.definition}
          apiDeployment={definitionSelection?.deployment}
          isLoading={api.isLoading || !definitionSelection}
        />
      )}
    </DetailPageLayout>
  );
};

export default React.memo(ApiDetailPage);
