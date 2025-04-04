import React, { useCallback, useMemo } from 'react';
import { Badge, Link, Spinner } from '@fluentui/react-components';
import { Api as DocsApi, InfoTable, ApiCard, MarkdownRenderer } from '@microsoft/api-docs-ui';
import { useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import useSearchFilters from '@/hooks/useSearchFilters';
import useApis from '@/hooks/useApis';
import useSearchQuery from '@/hooks/useSearchQuery';
import apiAdapter from '@/experiences/ApiList/apiAdapter';
import { Layouts } from '@/types/layouts';
import apiListLayoutAtom from '@/atoms/apiListLayoutAtom';
import LocationsService from '@/services/LocationsService';
import EmptyStateMessage from '@/components/EmptyStateMessage';
import styles from './ApiList.module.scss';

export const ApiList: React.FC = () => {
  const layout = useRecoilValue(apiListLayoutAtom);
  const searchFilters = useSearchFilters();
  const searchQuery = useSearchQuery();
  const navigate = useNavigate();
  const apis = useApis({ search: searchQuery.search, filters: searchFilters.activeFilters });

  const adaptedApiList = useMemo(() => apis.list.map(apiAdapter), [apis.list]);

  const apiLinkPropsProvider = useCallback(
    (api: DocsApi) => ({
      href: LocationsService.getApiInfoUrl(api.name),
      onClick: (e: React.MouseEvent) => {
        if (e.ctrlKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        navigate(LocationsService.getApiInfoUrl(api.name));
      },
    }),
    [navigate]
  );

  if (apis.isLoading) {
    return <Spinner size="small" />;
  }

  if (!apis.list.length) {
    return <EmptyStateMessage>Can’t find any search results. Try a different search term.</EmptyStateMessage>;
  }

  if (layout === Layouts.CARDS) {
    return (
      <div className={styles.cards}>
        {adaptedApiList.map((api) => (
          <ApiCard key={api.name} api={api} linkProps={apiLinkPropsProvider(api)} showType />
        ))}
      </div>
    );
  }

  return (
    <InfoTable columnLabels={['Name', 'Description', 'Lifecycle stage', 'Type']}>
      {adaptedApiList.map((api) => (
        <InfoTable.Row key={api.name}>
          <InfoTable.Cell>
            <Link {...apiLinkPropsProvider(api)}>{api.title}</Link>
          </InfoTable.Cell>
          <InfoTable.Cell>
            <MarkdownRenderer markdown={api.description} maxLength={120} />
          </InfoTable.Cell>
          <InfoTable.Cell>
            {!!api.lifecycleStage && (
              <Badge appearance="tint" color="informative" shape="rounded">
                {api.lifecycleStage}
              </Badge>
            )}
          </InfoTable.Cell>
          <InfoTable.Cell>
            {api.type && (
              <Badge appearance="tint" color="informative" shape="rounded">
                {api.type}
              </Badge>
            )}
          </InfoTable.Cell>
        </InfoTable.Row>
      ))}
    </InfoTable>
  );
};

export default React.memo(ApiList);
