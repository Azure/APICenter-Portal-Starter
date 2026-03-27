import React from 'react';
import { Link } from '@fluentui/react-components';
import { Open16Regular, DocumentTextRegular, PeopleRegular, ListRegular } from '@fluentui/react-icons';
import { ApiMetadata } from '@/types/api';
import CustomMetadata from '@/components/CustomMetadata';
import styles from './ApiAdditionalInfo.module.scss';

interface Props {
  api: ApiMetadata;
}

function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `https://${url}`;
}

export const ApiAdditionalInfo: React.FC<Props> = ({ api }) => {
  const hasCustomProperties = !!Object.keys(api.customProperties || {}).length;

  return (
    <div className={styles.apiAdditionalInfo}>
      {!!api.externalDocumentation?.length && (
        <div className={styles.section}>
          <h4>
            <span className={styles.sectionLabel}>
              <DocumentTextRegular />
              <strong>External documentation</strong>
            </span>
          </h4>
          <div className={styles.sectionContent}>
            {api.externalDocumentation
              .filter((d) => !!d.title && d.url)
              .map((documentation) => (
                <Link
                  key={documentation.title}
                  href={normalizeUrl(documentation.url)}
                  target="_blank"
                  className={styles.link}
                >
                  {documentation.title} <Open16Regular />
                </Link>
              ))}
          </div>
        </div>
      )}

      {!!api.contacts?.length && (
        <div className={styles.section}>
          <h4>
            <span className={styles.sectionLabel}>
              <PeopleRegular />
              <strong>Contact information</strong>
            </span>
          </h4>
          <div className={styles.sectionContent}>
            {api.contacts.map((contact) => (
              <React.Fragment key={contact.name}>
                {contact.url && (
                  <Link href={normalizeUrl(contact.url)} target="_blank" className={styles.link}>
                    {contact.name} <Open16Regular />
                  </Link>
                )}

                {!contact.url && !!contact.email && (
                  <Link href={`mailto:${contact.email}`} target="_blank" className={styles.link}>
                    {contact.name} <Open16Regular />
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {hasCustomProperties && (
        <div className={styles.section}>
          <h4>
            <span className={styles.sectionLabel}>
              <ListRegular />
              <strong>Properties</strong>
            </span>
          </h4>
          <div className={styles.sectionContent}>
            <CustomMetadata value={api.customProperties} />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ApiAdditionalInfo);
