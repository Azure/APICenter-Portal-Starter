import React from 'react';
import { Link } from '@fluentui/react-components';
import { Open16Regular } from '@fluentui/react-icons';
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
      {api.description && <p>{api.description}</p>}

      {!!api.externalDocumentation?.length && (
        <>
          <h4>External documentation</h4>
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
        </>
      )}

      {!!api.contacts?.length && (
        <>
          <h4>Contact information</h4>
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
        </>
      )}

      {hasCustomProperties && (
        <>
          <h4>Properties</h4>
          <CustomMetadata value={api.customProperties} />
        </>
      )}
    </div>
  );
};

export default React.memo(ApiAdditionalInfo);
