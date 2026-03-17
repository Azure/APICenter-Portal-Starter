import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Spinner } from '@fluentui/react-components';
import {
  FlashRegular,
  BotRegular,
  PlugConnectedRegular,
} from '@fluentui/react-icons';
import { usePlugin } from '@/hooks/usePlugin';
import { setDocumentTitle } from '@/utils/dom';
import { formatKindDisplay } from '@/utils/formatKind';
import { LocationsService } from '@/services/LocationsService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import { PluginResource } from '@/types/plugin';
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

function getResourceUrl(name: string, kind?: string): string {
  const k = kind?.toLowerCase();
  if (k === 'agent') return LocationsService.getAgentChatUrl(name);
  if (k === 'skill') return LocationsService.getSkillInfoUrl(name);
  return LocationsService.getApiInfoUrl(name);
}

interface ResolvedResource {
  name: string;
  title: string;
  summary?: string;
  kind: string;
}

export const PluginInfo: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const plugin = usePlugin(name);

  const groupedResources = useMemo(() => {
    const resources = plugin.data?.resources;
    if (!resources) return {};

    const groups: Record<string, ResolvedResource[]> = {};
    for (const [path, resource] of Object.entries(resources)) {
      const resourceName = path.split('/').pop() ?? path;
      const category = resource.kind?.toLowerCase() ?? 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push({
        name: resourceName,
        title: resource.title,
        summary: resource.summary,
        kind: resource.kind,
      });
    }
    return groups;
  }, [plugin.data?.resources]);

  const hasResources = Object.keys(groupedResources).length > 0;

  setDocumentTitle(`Plugin${plugin.data?.title ? ` - ${plugin.data.title}` : ''}`);

  if (plugin.isLoading) {
    return (
      <div className={styles.pluginInfo}>
        <Spinner className={styles.spinner} size="large" label="Loading..." labelPosition="below" />
      </div>
    );
  }

  if (!plugin.data) {
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
          <h1>{plugin.data.title}</h1>
          {plugin.data.description && (
            <p className={styles.summary}>{plugin.data.description}</p>
          )}
        </section>
      </div>

      <section>
        <div className={styles.content}>
          <div className={styles.description}>
            {plugin.data.description ? (
              <MarkdownRenderer markdown={plugin.data.description} />
            ) : (
              <EmptyStateMessage>No description available for this plugin.</EmptyStateMessage>
            )}

            {hasResources && (
              <div className={styles.resourcesSection}>
                {Object.entries(groupedResources).map(([category, items]) => (
                    <div key={category}>
                      <h3 className={styles.categoryHeading}>
                        {getCategoryLabel(category)}
                      </h3>
                      <div className={styles.resourceList}>
                        {items.map((resource) => (
                          <Link
                            key={resource.name}
                            to={getResourceUrl(resource.name, resource.kind)}
                            className={styles.resourceItem}
                          >
                            <span className={styles.resourceIcon}>
                              {KIND_ICONS[resource.kind?.toLowerCase() ?? ''] ?? <PlugConnectedRegular />}
                            </span>
                            <span className={styles.resourceTitle}>{resource.title}</span>
                            <p className={styles.summary}>{resource.summary}</p>
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
                }
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
