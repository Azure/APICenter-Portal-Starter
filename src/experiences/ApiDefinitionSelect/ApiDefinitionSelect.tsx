import React, { useCallback, useEffect, useState } from 'react';
import { Dropdown, Option } from '@fluentui/react-components';
import { find, isUndefined } from 'lodash';
import classNames from 'classnames';
import { ApiVersion } from '@/types/apiVersion';
import { ApiDefinition } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import useApiVersions from '@/hooks/useApiVersions';
import useApiDefinitions from '@/hooks/useApiDefinitions';
import useApiDeployments from '@/hooks/useApiDeployments';
import styles from './ApiDefinitionSelect.module.scss';

export interface ApiDefinitionSelection {
  version?: ApiVersion;
  definition?: ApiDefinition;
  deployment?: ApiDeployment;
}

interface Props {
  apiId: string;
  defaultSelection?: {
    version?: string;
    definition?: string;
    deployment?: string;
  };
  isInline?: boolean;
  hiddenSelects?: Array<keyof ApiDefinitionSelection>;
  onSelectionChange: (selection: ApiDefinitionSelection) => void;
}

const NO_VERSION_LABEL = "Version isn't available";
const NO_DEFINITION_LABEL = "Definition isn't available";
const NO_DEPLOYMENT_LABEL = "Deployment isn't available";

export const ApiDefinitionSelect: React.FC<Props> = ({
  apiId,
  defaultSelection = {},
  hiddenSelects = [],
  isInline,
  onSelectionChange,
}) => {
  const [version, setVersion] = useState<ApiVersion | null | undefined>();
  const [definition, setDefinition] = useState<ApiDefinition | null | undefined>();
  const [deployment, setDeployment] = useState<ApiDeployment | null | undefined>();

  const apiVersions = useApiVersions(apiId);
  const apiDefinitions = useApiDefinitions(apiId, version?.name);
  const apiDeployments = useApiDeployments(apiId);

  const dropdownSize = isInline ? 'small' : 'medium';

  // Set initial values
  useEffect(() => {
    const defaultName = defaultSelection.version || apiVersions.list[0]?.name;
    setVersion(find(apiVersions.list, { name: defaultName }) || null);
  }, [apiVersions.list, defaultSelection.version]);

  useEffect(() => {
    const defaultName = defaultSelection.definition || apiDefinitions.list[0]?.name;
    setDefinition(find(apiDefinitions.list, { name: defaultName }) || null);
  }, [apiDefinitions.list, defaultSelection.definition]);

  useEffect(() => {
    const defaultName = defaultSelection.deployment || apiDeployments.list[0]?.name;
    setDeployment(find(apiDeployments.list, { name: defaultName }) || null);
  }, [apiDeployments.list, defaultSelection.deployment]);

  // Reset definition when version changes
  useEffect(() => {
    setDefinition(undefined);
  }, [version]);

  /**
   * Trigger change event when all values are set and/or any value is changed.
   * If any of values is undefined the event won't trigger because it means that the value was not loaded yet.
   */
  useEffect(() => {
    if ([version, definition, deployment].some(isUndefined)) {
      return;
    }

    onSelectionChange({ version, definition, deployment });
  }, [definition, deployment, onSelectionChange, version]);

  const handleVersionSelect = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, data) => {
      setVersion(apiVersions.list.find((version) => version.name === data.selectedOptions[0]));
    },
    [apiVersions.list]
  );

  const handleDefinitionSelect = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, data) => {
      setDefinition(apiDefinitions.list.find((definition) => definition.name === data.selectedOptions[0]));
    },
    [apiDefinitions.list]
  );

  const handleDeploymentSelect = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, data) => {
      setDefinition(apiDeployments.list.find((deployment) => deployment.name === data.selectedOptions[0]));
    },
    [apiDeployments.list]
  );

  return (
    <div className={classNames(styles.apiDefinitionSelect, isInline && styles.isInline)}>
      {!hiddenSelects.includes('version') && (
        <div className={styles.selectionDropdown}>
          <label htmlFor="version-select">Version</label>

          <Dropdown
            id="version-select"
            className={styles.dropdown}
            placeholder="Select API version"
            size={dropdownSize}
            value={version?.title || NO_VERSION_LABEL}
            selectedOptions={[version?.name]}
            disabled={!apiVersions.list.length}
            inlinePopup
            onOptionSelect={handleVersionSelect}
          >
            {apiVersions.list.map((version) => (
              <Option key={version.name} value={version.name}>
                {version.title || version.name}
              </Option>
            ))}
          </Dropdown>
        </div>
      )}

      {!hiddenSelects.includes('definition') && (
        <div className={styles.selectionDropdown}>
          <label htmlFor="definition-select">Definition format</label>
          <Dropdown
            id="definition-select"
            className={styles.dropdown}
            placeholder="Select API definition"
            size={dropdownSize}
            value={definition?.title || NO_DEFINITION_LABEL}
            selectedOptions={[definition?.name]}
            disabled={!apiDefinitions.list.length}
            inlinePopup
            onOptionSelect={handleDefinitionSelect}
          >
            {apiDefinitions.list.map((definition) => (
              <Option key={definition.name} value={definition.name}>
                {definition.title}
              </Option>
            ))}
          </Dropdown>
        </div>
      )}

      {!hiddenSelects.includes('deployment') && (
        <div className={styles.selectionDropdown}>
          <label htmlFor="deployment-select">Deployment</label>
          <Dropdown
            id="deployment-select"
            className={styles.dropdown}
            placeholder="Select deployment"
            size={dropdownSize}
            value={deployment?.title || NO_DEPLOYMENT_LABEL}
            selectedOptions={[deployment?.name]}
            disabled={!apiDeployments.list.length}
            inlinePopup
            onOptionSelect={handleDeploymentSelect}
          >
            {apiDeployments.list.map((deployment) => (
              <Option key={deployment.name} value={deployment.name}>
                {deployment.title}
              </Option>
            ))}
          </Dropdown>
        </div>
      )}
    </div>
  );
};

export default React.memo(ApiDefinitionSelect);
