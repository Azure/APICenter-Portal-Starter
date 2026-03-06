import React, { useCallback, useMemo } from 'react';
import { Badge, Link, Spinner } from '@fluentui/react-components';
import { Api as DocsApi, InfoTable, ApiCard, MarkdownRenderer } from 'api-docs-ui';
import { useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { useApis } from '@/hooks/useApis';
import { useSearchQuery } from '@/hooks/useSearchQuery';
import { apiAdapter } from '@/experiences/ApiList/apiAdapter';
import { ApiMetadata } from '@/types/api';
import { Layouts } from '@/types/layouts';
import { apiListLayoutAtom } from '@/atoms/apiListLayoutAtom';
import { LocationsService } from '@/services/LocationsService';
import EmptyStateMessage from '@/components/EmptyStateMessage';
import styles from './ApiList.module.scss';

export const ApiList: React.FC = () => {
  const layout = useRecoilValue(apiListLayoutAtom);
  const searchFilters = useSearchFilters();
  const searchQuery = useSearchQuery();
  const navigate = useNavigate();
  const apis = useApis({
    search: searchQuery.search,
    filters: searchFilters.activeFilters,
    isSemanticSearch: searchQuery.isSemanticSearch,
  });

  const mockAgent: ApiMetadata = useMemo(() => ({
    name: 'apim-sre-agent',
    title: 'APIM SRE Agent',
    kind: 'agent',
    summary: 'An SRE agent to assist Azure API Management engineering team with service live site.',
    lifecycleStage: 'production',
  }), []);

  const adaptedApiList = useMemo(() => {
    const adapted = apis.data?.map(apiAdapter) ?? [];
    return [apiAdapter(mockAgent), ...adapted];
  }, [apis.data, mockAgent]);

  const apiLinkPropsProvider = useCallback(
    (api: DocsApi) => {
      const typedApi = api as DocsApi & { type?: string };
      const isSkill = typedApi.type === 'skill';
      const isAgent = typedApi.type === 'agent';
      let url: string;
      if (isAgent) {
        url = LocationsService.getAgentChatUrl(api.name);
      } else if (isSkill) {
        url = LocationsService.getSkillInfoUrl(api.name);
      } else {
        url = LocationsService.getApiInfoUrl(api.name);
      }

      return {
        href: url,
        onClick: (e: React.MouseEvent) => {
          if (e.ctrlKey || e.button !== 0) {
            return;
          }
          e.preventDefault();
          navigate(url);
        },
      };
    },
    [navigate]
  );

  const handleLoadMore = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      apis.fetchNextPage();
    },
    [apis]
  );

  function renderLoadMore() {
    if (!apis.hasNextPage) {
      return null;
    }

    if (apis.isFetchingNextPage) {
      return (
        <div className={styles.loadMore}>
          <Spinner size="tiny" />
        </div>
      );
    }

    return (
      <div className={styles.loadMore}>
        <Link onClick={handleLoadMore}>Load more</Link>
      </div>
    );
  }

  if (apis.isLoading) {
    return <Spinner size="small" />;
  }

  if (!apis.data.length) {
    return <EmptyStateMessage>Can’t find any search results. Try a different search term.</EmptyStateMessage>;
  }

  if (layout === Layouts.CARDS) {
    return (
      <>
        <div className={styles.cards}>
          {adaptedApiList.map((api) => (
            <ApiCard key={api.name} api={api} linkProps={apiLinkPropsProvider(api)} showType />
          ))}
        </div>
        {renderLoadMore()}
      </>
    );
  }

  return (
    <>
      <InfoTable columnLabels={['Name', 'Summary', 'Lifecycle stage', 'Type']}>
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
      {renderLoadMore()}
    </>
  );
};

export default React.memo(ApiList);
