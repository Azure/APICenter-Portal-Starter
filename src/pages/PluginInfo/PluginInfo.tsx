import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Tab, TabList } from '@fluentui/react-components';
import {
  PlugConnectedRegular,
  DocumentRegular,
} from '@fluentui/react-icons';
import { useRecoilValue } from 'recoil';
import { usePlugin } from '@/hooks/usePlugin';
import { configAtom } from '@/atoms/configAtom';
import { setDocumentTitle } from '@/utils/dom';
import { formatKindDisplay } from '@/utils/formatKind';
import { LocationsService } from '@/services/LocationsService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { DetailPageLayout, BreadcrumbItem } from '@/components/DetailPageLayout/DetailPageLayout';
import { InstallationBlock } from '@/components/InstallationBlock';
import { HomeLocationState } from '@/types/homeDrawer';
import styles from './PluginInfo.module.scss';

// VS Code Codicons — aligned with VS Code Agents app
const SkillCodicon = () => <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1C5.419 1 2.75 2.964 2.75 6.25C2.75 8.167 3.637 9.184 4.224 9.856C4.408 10.067 4.598 10.285 4.628 10.398L5.568 13.889C5.744 14.543 6.34 14.999 7.017 14.999H8.984C9.662 14.999 10.257 14.542 10.432 13.889L11.372 10.397C11.402 10.285 11.593 10.067 11.776 9.856C12.363 9.183 13.25 8.167 13.25 6.25C13.25 3.355 10.895 1 8 1ZM9.467 13.63C9.408 13.848 9.209 14 8.984 14H7.017C6.791 14 6.593 13.848 6.534 13.63L6.095 12H9.906L9.467 13.63ZM11.022 9.199C10.741 9.522 10.497 9.802 10.407 10.137L10.175 10.999H5.826L5.594 10.138C5.503 9.801 5.26 9.522 4.977 9.199C4.43 8.572 3.75 7.792 3.75 6.25C3.75 3.59 5.911 2 8 2C10.344 2 12.25 3.907 12.25 6.25C12.25 7.792 11.569 8.572 11.022 9.199Z"/></svg>;
const AgentCodicon = () => <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"><path d="M5.10198 3C4.92335 3 4.75829 3.0953 4.66897 3.25L2.07089 7.75C1.98158 7.9047 1.98158 8.0953 2.07089 8.25L4.5746 12.5866C4.72231 12.8424 4.99529 13 5.29071 13C5.65144 13 5.97055 12.7662 6.0792 12.4222L8.96823 3.27622C9.20821 2.51649 9.913 2 10.7097 2C11.3622 2 11.9651 2.34809 12.2914 2.91316L14.7953 7.25C15.0632 7.7141 15.0632 8.2859 14.7953 8.75L12.1972 13.25C11.9292 13.7141 11.434 14 10.8981 14H8.50155C8.22541 14 8.00155 13.7761 8.00155 13.5C8.00155 13.2239 8.22541 13 8.50155 13H10.8981C11.0768 13 11.2418 12.9047 11.3311 12.75L13.9292 8.25C14.0185 8.0953 14.0185 7.9047 13.9292 7.75L11.4254 3.41316C11.2777 3.1575 11.005 3 10.7097 3C10.3493 3 10.0304 3.23369 9.92179 3.57743L7.03276 12.7234C6.7927 13.4834 6.08769 14 5.29071 14C4.63803 14 4.03492 13.6518 3.70858 13.0866L1.20487 8.75C0.936918 8.2859 0.936919 7.7141 1.20487 7.25L3.80295 2.75C4.07089 2.2859 4.56609 2 5.10198 2H7.50155C7.77769 2 8.00155 2.22386 8.00155 2.5C8.00155 2.77614 7.77769 3 7.50155 3H5.10198Z"/></svg>;

const KIND_ICONS: Record<string, React.ReactNode> = {
  skill: <SkillCodicon />,
  agent: <AgentCodicon />,
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
  if (k === 'agent') return { to: LocationsService.getAgentInfoUrl(name) };
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
  const config = useRecoilValue(configAtom);

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

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [
    { label: 'Home', href: '/' },
    { label: 'Plugins', href: '/?kind=plugin' },
    { label: plugin.data?.title || name || '...' },
  ], [plugin.data?.title, name]);
  const tabs = (
    <TabList defaultSelectedValue="documentation">
      <Tab icon={<DocumentRegular />} value="documentation">Documentation</Tab>
    </TabList>
  );

  return (
    <DetailPageLayout
      title={plugin.data?.title}
      summary={plugin.data?.description}
      breadcrumbs={breadcrumbs}
      metadata={
        <Badge appearance="filled" color="brand" shape="circular">Plugin</Badge>
      }
      lastUpdated={plugin.data?.lastUpdated}
      tabs={tabs}
      isLoading={plugin.isLoading}
      emptyMessage={!plugin.data ? 'The specified plugin does not exist.' : undefined}
    >
      <InstallationBlock
        assetType="plugin"
        assetName={plugin.data?.name || name || 'plugin'}
        dataApiHostName={config.dataApiHostName}
      />

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
