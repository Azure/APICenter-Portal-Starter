import React, { useCallback, useMemo } from 'react';
import { Badge, Link, Spinner } from '@fluentui/react-components';
import { useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { useApis } from '@/hooks/useApis';
import { useSearchQuery } from '@/hooks/useSearchQuery';
import { ApiCard, type ApiCardApi } from '@/components/ApiCard';
import { InfoTable } from '@/components/InfoTable';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { formatKindDisplay } from '@/utils/formatKind';
import { apiAdapter } from '@/experiences/ApiList/apiAdapter';
import { ContributeCard } from '@/experiences/ContributeCard';
import { ApiMetadata } from '@/types/api';
import { AppCapabilities } from '@/types/config';
import { Layouts } from '@/types/layouts';
import { apiListLayoutAtom } from '@/atoms/apiListLayoutAtom';
import { configAtom } from '@/atoms/configAtom';
import { LocationsService } from '@/services/LocationsService';
import EmptyStateMessage from '@/components/EmptyStateMessage';
import styles from './ApiList.module.scss';

export const ApiList: React.FC = () => {
  const layout = useRecoilValue(apiListLayoutAtom);
  const config = useRecoilValue(configAtom);
  const searchFilters = useSearchFilters();
  const searchQuery = useSearchQuery();
  const navigate = useNavigate();
  const apis = useApis({
    search: searchQuery.search,
    filters: searchFilters.activeFilters,
    isSemanticSearch: searchQuery.isSemanticSearch,
  });

  // const mockAgent: ApiMetadata = useMemo(() => ({
  //   name: 'apim-sre-agent',
  //   title: 'APIM SRE Agent',
  //   kind: 'agent',
  //   summary: 'An SRE agent to assist Azure API Management engineering team with service live site.',
  //   lifecycleStage: 'production',
  // }), []);

  const adaptedApiList = useMemo(() => {
    const adapted = apis.data?.map(apiAdapter) ?? [];
    return adapted;
  }, [apis.data]);

  const apiLinkPropsProvider = useCallback(
    (api: ApiCardApi) => {
      const typedApi = api as ApiCardApi & { type?: string };
      const kind = typedApi.type?.toLowerCase();
      let url: string;
      if (kind === 'agent') {
        url = LocationsService.getAgentChatUrl(api.name);
      } else if (kind === 'skill') {
        url = LocationsService.getSkillInfoUrl(api.name);
      } else if (kind === 'plugin') {
        url = LocationsService.getPluginInfoUrl(api.name);
      } else if (kind === 'languagemodel') {
        url = LocationsService.getModelPlaygroundUrl(api.name);
      } else {
        url = LocationsService.getApiDetailUrl(api.name);
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

  const showContributeCard = config.capabilities?.includes(AppCapabilities.CONTRIBUTIONS)
    && !!config.contributions?.gitRepositoryUrl;

  if (!apis.data?.length) {
    return <EmptyStateMessage>Can't find any search results. Try a different search term.</EmptyStateMessage>;
  }

  if (layout === Layouts.CARDS) {
    return (
      <>
        <div className={styles.cards}>
          {showContributeCard && (
            <ContributeCard url={config.contributions!.gitRepositoryUrl} />
          )}
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Badge appearance="filled" color="brand" shape="circular">
                  {['skill', 'a2a', 'mcp', 'plugin', 'agent', 'languagemodel'].includes(api.type?.toLowerCase() ?? '') ? formatKindDisplay(api.type!) : 'API'}
                </Badge>
                {!!api.type && !['skill', 'a2a', 'mcp', 'plugin', 'agent', 'languagemodel'].includes(api.type.toLowerCase()) && (
                  <Badge appearance="tint" color="brand" shape="circular">
                    {formatKindDisplay(api.type)}
                  </Badge>
                )}
              </div>
            </InfoTable.Cell>
          </InfoTable.Row>
        ))}
      </InfoTable>
      {renderLoadMore()}
    </>
  );
};

export default React.memo(ApiList);
