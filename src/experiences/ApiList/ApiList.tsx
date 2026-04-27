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
import { ENABLE_LIST_EVAL_BADGES } from '@/constants/featureFlags';
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

  const getApiUrl = useCallback(
    (api: ApiCardApi) => {
      const kind = (api as ApiCardApi & { type?: string }).type?.toLowerCase();
      if (kind === 'agent') return LocationsService.getAgentChatUrl(api.name);
      if (kind === 'skill') return LocationsService.getSkillInfoUrl(api.name);
      if (kind === 'plugin') return LocationsService.getPluginInfoUrl(api.name);
      if (kind === 'languagemodel') return LocationsService.getModelPlaygroundUrl(api.name);
      return LocationsService.getApiDetailUrl(api.name);
    },
    []
  );

  const apiClickHandler = useCallback(
    (api: ApiCardApi) => {
      return (e: React.MouseEvent) => {
        const url = getApiUrl(api);
        if (e.ctrlKey || e.metaKey || e.button !== 0) {
          window.open(url, '_blank');
          return;
        }
        navigate(url);
      };
    },
    [navigate, getApiUrl]
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
            <ApiCard key={api.name} api={api} onClick={apiClickHandler(api)} showType />
          ))}
        </div>
        {renderLoadMore()}
      </>
    );
  }

  return (
    <>
      <InfoTable columnLabels={['Name', 'Summary', ...(ENABLE_LIST_EVAL_BADGES ? ['Score'] : []), 'Lifecycle stage', 'Type']}>
        {adaptedApiList.map((api) => (
          <InfoTable.Row key={api.name}>
            <InfoTable.Cell>
              <Link href={getApiUrl(api)} onClick={(e) => { e.preventDefault(); navigate(getApiUrl(api)); }}>{api.title}</Link>
            </InfoTable.Cell>
            <InfoTable.Cell>
              <MarkdownRenderer markdown={api.description} maxLength={120} />
            </InfoTable.Cell>
            {ENABLE_LIST_EVAL_BADGES && (
              <InfoTable.Cell>
                {api.evalScore != null && api.evalMaxScore != null && api.evalMaxScore > 0 && (
                  <Badge
                    appearance="filled"
                    color={api.evalScore / api.evalMaxScore >= 0.8 ? 'success' : api.evalScore / api.evalMaxScore >= 0.6 ? 'warning' : 'danger'}
                    shape="circular"
                  >
                    {(api.evalScore / api.evalMaxScore * 5).toFixed(1)}/5
                  </Badge>
                )}
              </InfoTable.Cell>
            )}
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
