import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Tab, TabList } from '@fluentui/react-components';
import {
  FlashRegular,
  BotRegular,
  PlugConnectedRegular,
  DocumentRegular,
} from '@fluentui/react-icons';
import { usePlugin } from '@/hooks/usePlugin';
import { setDocumentTitle } from '@/utils/dom';
import { formatKindDisplay } from '@/utils/formatKind';
import { LocationsService } from '@/services/LocationsService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { DetailPageLayout } from '@/components/DetailPageLayout/DetailPageLayout';
import { HomeLocationState } from '@/types/homeDrawer';
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

function getResourceNavigation(name: string, kind?: string): { to: string; state?: HomeLocationState } {
  const k = kind?.toLowerCase();
  if (k === 'agent') return { to: LocationsService.getAgentChatUrl(name) };
  if (k === 'skill') return { to: LocationsService.getSkillInfoUrl(name) };
  if (k === 'languagemodel') {
    return { to: LocationsService.getModelDetailUrl(name) };
  }
  return {
    to: LocationsService.getHomeUrl(true),
    state: { drawer: { kind: 'api', name } },
  };
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

    const items = Array.isArray(resources) ? resources : Object.values(resources);
    for (const resource of items) {
      // Extract the API name from resourceId (e.g. "/workspaces/default/apis/my-api" -> "my-api")
      const resourceName = resource.resourceId?.replace(/\/+$/, '').split('/').pop() || resource.title;
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

  const tabs = (
    <TabList defaultSelectedValue="documentation">
      <Tab icon={<DocumentRegular />} value="documentation">Documentation</Tab>
    </TabList>
  );

  return (
    <DetailPageLayout
      title={plugin.data?.title}
      summary={plugin.data?.description}
      tabs={tabs}
      isLoading={plugin.isLoading}
      emptyMessage={!plugin.data ? 'The specified plugin does not exist.' : undefined}
    >
      {plugin.data?.description ? (
        <MarkdownRenderer markdown={plugin.data.description} />
      ) : null}

      {hasResources && (
        <div className={styles.resourcesSection}>
          {Object.entries(groupedResources).map(([category, items]) => (
            <div key={category}>
              <h3 className={styles.categoryHeading}>
                {getCategoryLabel(category)}
              </h3>
              <div className={styles.resourceList}>
                {items.map((resource) => {
                  const navigation = getResourceNavigation(resource.name, resource.kind);
                  return (
                    <Link
                      key={resource.name}
                      to={navigation.to}
                      state={navigation.state}
                      className={styles.resourceItem}
                    >
                      <span className={styles.resourceIcon}>
                        {KIND_ICONS[resource.kind?.toLowerCase() ?? ''] ?? <PlugConnectedRegular />}
                      </span>
                      <span className={styles.resourceTitle}>{resource.title}</span>
                      <Badge
                        className={styles.resourceBadge}
                        appearance="filled"
                        color="brand"
                        shape="circular"
                        size="small"
                      >
                        {formatKindDisplay(resource.kind ?? 'API')}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DetailPageLayout>
  );
};

export default React.memo(PluginInfo);
