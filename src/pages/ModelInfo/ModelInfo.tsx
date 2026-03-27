import React, { useCallback, useState } from 'react';
import {
  Badge,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Link,
  Spinner,
  Subtitle2,
  Tab,
  TabList,
} from '@fluentui/react-components';
import { Dismiss24Regular, OpenRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useLanguageModel } from '@/hooks/useLanguageModel';

import { LocationsService } from '@/services/LocationsService';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { setDocumentTitle } from '@/utils/dom';
import styles from './ModelInfo.module.scss';

interface Props {
  name: string;
}

enum Tabs {
  OPTIONS = 'options',
  MORE_DETAILS = 'more-details',
}

export const ModelInfo: React.FC<Props> = ({ name }) => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.OPTIONS);
  const navigate = useNavigate();
  const model = useLanguageModel(name);

  setDocumentTitle(`Model${model.data?.title ? ` - ${model.data.title}` : ''}`);

  const handleTabSelect = useCallback<React.ComponentProps<typeof TabList>['onTabSelect']>((_, { value }) => {
    setActiveTab(value as Tabs);
  }, []);

  const handleClose = useCallback(() => {
    navigate(LocationsService.getHomeUrl(true));
  }, [navigate]);

  function renderOptionsTab() {
    if (!model.data) return null;

    return (
      <>
        {model.data.modelProvider && (
          <div className={styles.section}>
            <dl className={styles.detailsGrid}>
              <dt>Provider</dt>
              <dd>{model.data.modelProvider}</dd>

              {model.data.modelName && (
                <>
                  <dt>Model name</dt>
                  <dd>{model.data.modelName}</dd>
                </>
              )}

              {model.data.contextWindow?.inputTokens != null && (
                <>
                  <dt>Input tokens</dt>
                  <dd>{model.data.contextWindow.inputTokens.toLocaleString()}</dd>
                </>
              )}

              {model.data.contextWindow?.outputTokens != null && (
                <>
                  <dt>Output tokens</dt>
                  <dd>{model.data.contextWindow.outputTokens.toLocaleString()}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        {!!model.data.taskTypes?.length && (
          <div className={styles.section}>
            <Subtitle2>Task types</Subtitle2>
            <div className={styles.badges}>
              {model.data.taskTypes.map((t) => (
                <Badge key={t} appearance="tint" color="informative" shape="rounded">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {!!model.data.inputTypes?.length && (
          <div className={styles.section}>
            <Subtitle2>Input types</Subtitle2>
            <div className={styles.badges}>
              {model.data.inputTypes.map((t) => (
                <Badge key={t} appearance="tint" color="informative" shape="rounded">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {!!model.data.outputTypes?.length && (
          <div className={styles.section}>
            <Subtitle2>Output types</Subtitle2>
            <div className={styles.badges}>
              {model.data.outputTypes.map((t) => (
                <Badge key={t} appearance="tint" color="informative" shape="rounded">{t}</Badge>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  function renderMoreDetailsTab() {
    if (!model.data) return null;

    return (
      <>
        {(model.data.description || model.data.summary) && (
          <div className={styles.section}>
            <Subtitle2>Description</Subtitle2>
            <MarkdownRenderer markdown={(model.data.description || model.data.summary)!} />
          </div>
        )}

        {!!model.data.contacts?.length && (
          <div className={styles.section}>
            <Subtitle2>Contacts</Subtitle2>
            {model.data.contacts.map((c, idx) => (
              <div key={idx}>
                {c.name && <span>{c.name}</span>}
                {c.email && <> – <Link href={`mailto:${c.email}`}>{c.email}</Link></>}
                {c.url && <> – <Link href={c.url} target="_blank">{c.url}</Link></>}
              </div>
            ))}
          </div>
        )}

        {!!model.data.externalDocumentation?.length && (
          <div className={styles.section}>
            <Subtitle2>External documentation</Subtitle2>
            {model.data.externalDocumentation.map((doc, idx) => (
              <div key={idx}>
                {doc.url ? (
                  <Link href={doc.url} target="_blank">{doc.title || doc.url}</Link>
                ) : (
                  <span>{doc.title}</span>
                )}
                {doc.description && <p>{doc.description}</p>}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderContent() {
    if (model.isLoading) {
      return <Spinner className={styles.spinner} size="small" label="Loading..." labelPosition="below" />;
    }

    if (!model.data) {
      return <EmptyStateMessage>The specified model does not exist</EmptyStateMessage>;
    }

    return (
      <>
        {model.data.lastUpdated && (
          <p className={styles.metadata}>Last update {new Date(model.data.lastUpdated).toLocaleDateString()}</p>
        )}

        {model.data.lifecycleStage && (
          <div className={styles.badges}>
            <Badge appearance="tint" color="informative" shape="rounded">{model.data.lifecycleStage}</Badge>
          </div>
        )}

        {model.data.summary && <p>{model.data.summary}</p>}

        <div className={styles.tabsContainer}>
          <TabList selectedValue={activeTab} onTabSelect={handleTabSelect}>
            <Tab value={Tabs.OPTIONS}>Options</Tab>
            <Tab value={Tabs.MORE_DETAILS}>More about this model</Tab>
          </TabList>
          <Divider />
        </div>

        {activeTab === Tabs.OPTIONS
          ? <div className={styles.tabContent}>{renderOptionsTab()}</div>
          : <div className={styles.tabContent}>{renderMoreDetailsTab()}</div>}
      </>
    );
  }

  return (
    <Drawer className={styles.modelInfo} size="medium" position="end" open onOpenChange={handleClose}>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={handleClose} />}
        >
          {model.data?.title}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>{renderContent()}</DrawerBody>
    </Drawer>
  );
};

export default React.memo(ModelInfo);
