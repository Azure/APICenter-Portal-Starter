import React from 'react';
import { isArray, isBoolean, isPlainObject } from 'lodash';
import styles from './CustomMetadata.module.scss';

interface Props {
  value: unknown;
}

export const CustomMetadata: React.FC<Props> = ({ value }) => {
  if (isPlainObject(value)) {
    return (
      <div className={styles.object}>
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className={styles.property}>
            <span className={styles.name}>{key}:</span>
            <span className={styles.value}>
              <CustomMetadata value={val} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (isArray(value)) {
    if (!value.length) {
      return '[]';
    }

    return (
      <div className={styles.array}>
        {value.map((item, index) => (
          <CustomMetadata key={index} value={item} />
        ))}
      </div>
    );
  }

  if (isBoolean(value)) {
    return <span>{value ? 'Yes' : 'No'}</span>;
  }

  return <span>{String(value)}</span>;
};

export default React.memo(CustomMetadata);
