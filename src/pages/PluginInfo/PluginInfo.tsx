import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Spinner } from '@fluentui/react-components';
import { useQueries } from '@tanstack/react-query';
import {
  FlashRegular,
  BotRegular,
  PlugConnectedRegular,
} from '@fluentui/react-icons';
import { useApi } from '@/hooks/useApi';
import { setDocumentTitle } from '@/utils/dom';
import { formatKindDisplay } from '@/utils/formatKind';
import { LocationsService } from '@/services/LocationsService';
import { HttpService } from '@/services/HttpService';
import { QueryKeys } from '@/constants/QueryKeys';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import { ApiMetadata } from '@/types/api';
import styles from './PluginInfo.module.scss';

const KIND_ICONS: Record<string, React.ReactNode> = {
  skill: <FlashRegular />,
  agent: <BotRegular />,
};

const CATEGORY_LABELS: Record<string, string> = {
  skill: 'Skills',
  agent: 'Agents',
  mcp: 'MCP servers',
  plugin: 'Plugins',
  rest: 'REST APIs',
};

function getCategoryLabel(kind: string): string {
  return CATEGORY_LABELS[kind] ?? `${formatKindDisplay(kind)}s`;
}

function getResourceUrl(resource: ApiMetadata): string {
  const kind = resource.kind?.toLowerCase();
  if (kind === 'agent') return LocationsService.getAgentChatUrl(resource.name);
  if (kind === 'skill') return LocationsService.getSkillInfoUrl(resource.name);
  return LocationsService.getApiInfoUrl(resource.name);
}

export const PluginInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);

  const resourceIds = api.data?.resourceIds ?? [];

  const resourceQueries = useQueries({
    queries: resourceIds.map((id) => {
      // resourceIds contain full paths like "/workspaces/default/skills/name"
      // but the workspace prefix is already part of the base URL, so strip it
      const endpoint = id.replace(/^\/workspaces\/[^/]+/, '');
      return {
        queryKey: [QueryKeys.Api, id],
        queryFn: () => HttpService.get<ApiMetadata>(endpoint),
        staleTime: Infinity,
        enabled: resourceIds.length > 0,
      };
    }),
  });

  const isLoadingResources = resourceQueries.some((q) => q.isLoading);
  const resources = resourceQueries
    .map((q) => q.data)
    .filter((r): r is ApiMetadata => !!r);

  const groupedResources = useMemo(() => {
    const groups: Record<string, ApiMetadata[]> = {};
    for (const resource of resources) {
      const category = resource.kind?.toLowerCase() ?? 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(resource);
    }
    return groups;
  }, [resources]);

  setDocumentTitle(`Plugin${api.data?.title ? ` - ${api.data.title}` : ''}`);

  if (api.isLoading) {
    return (
      <div className={styles.pluginInfo}>
        <Spinner className={styles.spinner} size="large" label="Loading..." labelPosition="below" />
      </div>
    );
  }

  if (!api.data) {
    return (
      <div className={styles.pluginInfo}>
        <section>
          <EmptyStateMessage>The specified plugin does not exist.</EmptyStateMessage>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.pluginInfo}>
      <div className={styles.header}>
        <section>
          <h1>{api.data.title}</h1>
          {api.data.summary && (
            <p className={styles.summary}>{api.data.summary}</p>
          )}
        </section>
      </div>

      <section>
        <div className={styles.content}>
          <div className={styles.description}>
            {(api.data.description || api.data.summary) ? (
              <MarkdownRenderer markdown={(api.data.description || api.data.summary)!} />
            ) : (
              <EmptyStateMessage>No description available for this plugin.</EmptyStateMessage>
            )}

            {resourceIds.length > 0 && (
              <div className={styles.resourcesSection}>
                {isLoadingResources ? (
                  <Spinner size="small" label="Loading resources..." labelPosition="after" />
                ) : (
                  Object.entries(groupedResources).map(([category, items]) => (
                    <div key={category}>
                      <h3 className={styles.categoryHeading}>
                        {getCategoryLabel(category)}
                      </h3>
                      <div className={styles.resourceList}>
                        {items.map((resource) => (
                          <Link
                            key={resource.name}
                            to={getResourceUrl(resource)}
                            className={styles.resourceItem}
                          >
                            <span className={styles.resourceIcon}>
                              {KIND_ICONS[resource.kind?.toLowerCase() ?? ''] ?? <PlugConnectedRegular />}
                            </span>
                            <span className={styles.resourceTitle}>{resource.title}</span>
                            <Badge
                              className={styles.resourceBadge}
                              appearance="tint"
                              color="informative"
                              shape="rounded"
                              size="small"
                            >
                              {formatKindDisplay(resource.kind ?? 'API')}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <aside className={styles.sidebar}>
            {/* Sidebar content for plugin actions */}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default React.memo(PluginInfo);
