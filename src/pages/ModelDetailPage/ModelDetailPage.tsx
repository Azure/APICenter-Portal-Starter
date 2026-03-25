import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Button, Link, Subtitle2 } from '@fluentui/react-components';
import { OpenRegular } from '@fluentui/react-icons';
import { useLanguageModel } from '@/hooks/useLanguageModel';
import { setDocumentTitle } from '@/utils/dom';
import { LocationsService } from '@/services/LocationsService';
import { DetailPageLayout } from '@/components/DetailPageLayout/DetailPageLayout';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from './ModelDetailPage.module.scss';

export const ModelDetailPage: React.FC = () => {
  const { apiName } = useParams<{ apiName: string }>();
  const navigate = useNavigate();
  const model = useLanguageModel(apiName);

  setDocumentTitle(`Model${model.data?.title ? ` - ${model.data.title}` : ''}`);

  return (
    <DetailPageLayout
      title={model.data?.title}
      summary={model.data?.summary}
      metadata={
        <>
          {model.data?.lastUpdated && <span>Last updated {new Date(model.data.lastUpdated).toLocaleDateString()}</span>}
          {model.data?.lifecycleStage && (
            <Badge appearance="tint" color="informative" shape="rounded">
              {model.data.lifecycleStage}
            </Badge>
          )}
        </>
      }
      headerActions={
        model.data ? (
          <Button
            appearance="primary"
            icon={<OpenRegular />}
            onClick={() => navigate(LocationsService.getModelPlaygroundUrl(model.data!.name))}
          >
            Open in playground
          </Button>
        ) : undefined
      }
      isLoading={model.isLoading}
      emptyMessage={!model.isLoading && !model.data ? 'The specified model does not exist.' : undefined}
      sidebar={
        model.data ? (
          <div className={styles.sidebar}>
            {model.data.modelProvider && (
              <div className={styles.section}>
                <Subtitle2>Details</Subtitle2>
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

            {!!model.data.contacts?.length && (
              <div className={styles.section}>
                <Subtitle2>Contacts</Subtitle2>
                {model.data.contacts.map((c, idx) => (
                  <div key={idx}>
                    {c.name && <span>{c.name}</span>}
                    {c.email && (
                      <>
                        {' '}
                        – <Link href={`mailto:${c.email}`}>{c.email}</Link>
                      </>
                    )}
                    {c.url && (
                      <>
                        {' '}
                        –{' '}
                        <Link href={c.url} target="_blank">
                          {c.url}
                        </Link>
                      </>
                    )}
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
                      <Link href={doc.url} target="_blank">
                        {doc.title || doc.url}
                      </Link>
                    ) : (
                      <span>{doc.title}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : undefined
      }
    >
      {model.data && (
        <div>
          {!!model.data.taskTypes?.length && (
            <div className={styles.badgeSection}>
              <Subtitle2>Task types</Subtitle2>
              <div className={styles.badges}>
                {model.data.taskTypes.map((t) => (
                  <Badge key={t} appearance="tint" color="informative" shape="rounded">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!!model.data.inputTypes?.length && (
            <div className={styles.badgeSection}>
              <Subtitle2>Input types</Subtitle2>
              <div className={styles.badges}>
                {model.data.inputTypes.map((t) => (
                  <Badge key={t} appearance="tint" color="informative" shape="rounded">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!!model.data.outputTypes?.length && (
            <div className={styles.badgeSection}>
              <Subtitle2>Output types</Subtitle2>
              <div className={styles.badges}>
                {model.data.outputTypes.map((t) => (
                  <Badge key={t} appearance="tint" color="informative" shape="rounded">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(model.data.description || model.data.summary) && (
            <div className={styles.descriptionSection}>
              <Subtitle2>Description</Subtitle2>
              <MarkdownRenderer markdown={(model.data.description || model.data.summary)!} />
            </div>
          )}
        </div>
      )}
    </DetailPageLayout>
  );
};

export default React.memo(ModelDetailPage);
