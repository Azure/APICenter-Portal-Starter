import React from 'react';
import { isArray, isBoolean, isPlainObject } from 'lodash';
import { useMetadataSchemas } from '@/hooks/useMetadataSchemas';
import styles from './CustomMetadata.module.scss';

interface Props {
  value: unknown;
  /** Whether this is the root level (to fetch schema titles) */
  isRoot?: boolean;
}

interface ValueRendererProps {
  value: unknown;
}

const ValueRenderer: React.FC<ValueRendererProps> = ({ value }) => {
  if (isPlainObject(value)) {
    return (
      <div className={styles.object}>
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className={styles.property}>
            <span className={styles.name}>{key}:</span>
            <span className={styles.value}>
              <ValueRenderer value={val} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (isArray(value)) {
    if (!value.length) {
      return <>{'[]'}</>;
    }

    return (
      <div className={styles.array}>
        {value.map((item, index) => (
          <ValueRenderer key={index} value={item} />
        ))}
      </div>
    );
  }

  if (isBoolean(value)) {
    return <span>{value ? 'Yes' : 'No'}</span>;
  }

  return <span>{String(value)}</span>;
};

export const CustomMetadata: React.FC<Props> = ({ value, isRoot = true }) => {
  const { data: schemaMap } = useMetadataSchemas();

  // For root level objects, use schema titles for property names
  if (isRoot && isPlainObject(value)) {
    return (
      <div className={styles.object}>
        {Object.entries(value).map(([key, val]) => {
          const schema = schemaMap?.get(key);
          const displayName = schema?.title || key;

          return (
            <div key={key} className={styles.property}>
              <span className={styles.name}>{displayName}:</span>
              <span className={styles.value}>
                <ValueRenderer value={val} />
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // For non-root values, just render the value
  return <ValueRenderer value={value} />;
};

export default React.memo(CustomMetadata);
