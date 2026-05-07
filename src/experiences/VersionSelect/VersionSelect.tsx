import React, { useCallback } from 'react';
import { Dropdown, Option } from '@fluentui/react-components';
import classNames from 'classnames';
import styles from './VersionSelect.module.scss';

/**
 * Minimal shape any version-like entity must satisfy. Both `ApiVersion` and
 * `AgentVersion` are compatible with this.
 */
export interface VersionOption {
  name: string;
  title?: string;
}

interface Props {
  /** id used to associate the label with the dropdown */
  id?: string;
  versions: VersionOption[];
  selectedName?: string;
  /** Inline (compact) layout uses small dropdown size and tighter spacing. */
  isInline?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  /** Text shown when no version is selected and `selectedName` resolves to nothing. */
  noVersionLabel?: string;
  onChange: (name: string) => void;
}

const DEFAULT_NO_VERSION_LABEL = "Version isn't available";

export const VersionSelect: React.FC<Props> = ({
  id = 'version-select',
  versions,
  selectedName,
  isInline,
  disabled,
  label = 'Version',
  placeholder = 'Select version',
  noVersionLabel = DEFAULT_NO_VERSION_LABEL,
  onChange,
}) => {
  const handleSelect = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, data) => {
      const next = data.optionValue ?? data.selectedOptions[0];
      if (next) onChange(next);
    },
    [onChange]
  );

  const selected = versions.find((v) => v.name === selectedName);
  const valueLabel = selected?.title ?? selected?.name ?? noVersionLabel;
  const isDisabled = disabled ?? versions.length === 0;

  return (
    <div className={classNames(styles.versionSelect, isInline && styles.isInline)}>
      <label htmlFor={id}>{label}</label>
      <Dropdown
        id={id}
        className={styles.dropdown}
        placeholder={placeholder}
        size={isInline ? 'small' : 'medium'}
        value={valueLabel}
        selectedOptions={selectedName ? [selectedName] : []}
        disabled={isDisabled}
        onOptionSelect={handleSelect}
      >
        {versions.map((v) => (
          <Option key={v.name} value={v.name}>
            {v.title || v.name}
          </Option>
        ))}
      </Dropdown>
    </div>
  );
};

export default React.memo(VersionSelect);
