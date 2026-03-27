import React from 'react';
import { Badge } from '@fluentui/react-components';
import { formatKindDisplay } from '@/utils/formatKind';
import styles from './ApiCard.module.scss';

export interface ApiCardApi {
  name: string;
  displayName: string;
  description: string;
  type?: string;
  lifecycleStage?: string;
}

interface Props {
  api: ApiCardApi;
  linkProps?: React.HTMLProps<HTMLAnchorElement>;
  showType?: boolean;
}

const STANDALONE_KINDS = ['skill', 'a2a', 'mcp', 'plugin', 'agent', 'languagemodel'];

function getCategoryLabel(type?: string): string {
  if (type && STANDALONE_KINDS.includes(type.toLowerCase())) {
    return formatKindDisplay(type);
  }
  return 'API';
}

export const ApiCard: React.FC<Props> = ({ api, showType, linkProps }) => (
  <a
    {...linkProps}
    className={styles.apiCard}
    title={api.displayName}
  >
    <div className={styles.cardContent}>
      {showType && (
        <div className={styles.tags}>
          <Badge appearance="filled" color="brand" shape="circular">{getCategoryLabel(api.type)}</Badge>
          {!!api.type && !STANDALONE_KINDS.includes(api.type.toLowerCase()) && (
            <Badge appearance="tint" color="brand" shape="circular">{formatKindDisplay(api.type)}</Badge>
          )}
        </div>
      )}
      <h4 className={styles.title}>{api.displayName}</h4>
      {api.description && <p className={styles.description}>{api.description}</p>}
    </div>
  </a>
);

export default React.memo(ApiCard);
