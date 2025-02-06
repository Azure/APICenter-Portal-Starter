import React, { useCallback, useMemo } from 'react';
import { Spinner } from '@fluentui/react-components';
import { Api as DocsApi, ApiListCardsView, ApiListTableView } from '@microsoft/api-docs-ui';
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

  let ListView: typeof ApiListTableView | typeof ApiListCardsView = ApiListCardsView;
  if (layout === Layouts.TABLE) {
    ListView = ApiListTableView;
  }

  return <ListView apis={adaptedApiList} apiLinkPropsProvider={apiLinkPropsProvider} showApiType />;
};

export default React.memo(ApiList);
