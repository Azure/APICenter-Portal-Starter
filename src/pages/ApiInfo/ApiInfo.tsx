import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Dropdown,
  Option,
  Spinner,
  Subtitle2,
  Tab,
  TabList,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { useParams } from 'react-router-dom';
import useApi from '@/hooks/useApi';
import useApiVersions from '@/hooks/useApiVersions';
import { ApiVersion } from '@/contracts/apiVersion';
import useApiDefinitions from '@/hooks/useApiDefinitions';
import { ApiDefinition } from '@/contracts/apiDefinition';
import useApiDeployments from '@/hooks/useApiDeployments';
import { ApiDeployment } from '@/contracts/apiDeployment';
import ApiAdditionalInfo from './ApiAdditionalInfo';
import ApiInfoOptions from './ApiInfoOptions';
import styles from './ApiInfo.module.scss';

interface RouteParams {
  id: string;
}

enum Tabs {
  OPTIONS = 'options',
  MORE_DETAILS = 'more-details',
}

const NO_VERSION_LABEL = "Version isn't available";
const NO_DEFINITION_LABEL = "Definition isn't available";
const NO_DEPLOYMENT_LABEL = "Deployment isn't available";

export const ApiInfo: React.FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<ApiVersion | undefined>();
  const [selectedDefinition, setSelectedDefinition] = useState<ApiDefinition | undefined>();
  const [selectedDeployment, setSelectedDeployment] = useState<ApiDeployment | undefined>();
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.OPTIONS);

  const { id } = useParams() as Readonly<RouteParams>;
  const api = useApi(id);
  const apiVersions = useApiVersions(id);
  const apiDefinitions = useApiDefinitions(id, selectedVersion?.name);
  const apiDeployments = useApiDeployments(id);

  useEffect(() => {
    setSelectedVersion(apiVersions.list[0]);
  }, [apiVersions.list]);

  useEffect(() => {
    setSelectedDefinition(apiDefinitions.list[0]);
  }, [apiDefinitions.list]);

  useEffect(() => {
    setSelectedDeployment(apiDeployments.list[0]);
  }, [apiDeployments.list]);

  const handleVersionSelect = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, data) => {
      setSelectedVersion(apiVersions.list.find((version) => version.name === data.selectedOptions[0]));
    },
    [apiVersions.list]
  );

  const handleDefinitionSelect = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, data) => {
      setSelectedDefinition(apiDefinitions.list.find((definition) => definition.name === data.selectedOptions[0]));
    },
    [apiDefinitions.list]
  );

  const handleDeploymentSelect = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, data) => {
      setSelectedDeployment(apiDeployments.list.find((deployment) => deployment.name === data.selectedOptions[0]));
    },
    [apiDeployments.list]
  );

  const handleTabSelect = useCallback<React.ComponentProps<typeof TabList>['onTabSelect']>((_, { value }) => {
    setActiveTab(value as Tabs);
  }, []);

  function renderSelectedTabContent() {
    if (activeTab === Tabs.OPTIONS) {
      return (
        <ApiInfoOptions
          api={api.data}
          apiVersion={selectedVersion}
          apiDefinition={selectedDefinition}
          apiDeployment={selectedDeployment}
          isLoading={api.isLoading || apiVersions.isLoading || apiDefinitions.isLoading || apiDeployments.isLoading}
        />
      );
    }

    return <ApiAdditionalInfo api={api.data} />;
  }

  function renderContent() {
    if (api.isLoading) {
      return <Spinner className={styles.spinner} size="small" label="Loading..." labelPosition="below" />;
    }

    if (!api.data) {
      // TODO: Add error state
      return null;
    }

    return (
      <>
        <p className={styles.metadata}>Last update {new Date(api.data.lastUpdated).toLocaleDateString()}</p>

        <Subtitle2>Select the API version</Subtitle2>
        <Divider className={styles.divider} />

        <p>
          Choose the API version, definition format, and deployment lifecycle stage. You can then download the
          definition, open it in Visual Studio Code, or run it in Postman.
        </p>

        <div className={styles.selectionDropdown}>
          <label htmlFor="version-select">Version</label>

          <Dropdown
            id="version-select"
            placeholder="Select API version"
            value={selectedVersion?.title || NO_VERSION_LABEL}
            selectedOptions={[selectedVersion?.name]}
            disabled={!apiVersions.list.length}
            onOptionSelect={handleVersionSelect}
          >
            {apiVersions.list.map((version) => (
              <Option key={version.name} value={version.name}>
                {version.title || version.name}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.selectionDropdown}>
          <label htmlFor="definition-select">Definition format</label>
          <Dropdown
            id="definition-select"
            placeholder="Select API definition"
            value={selectedDefinition?.title || NO_DEFINITION_LABEL}
            selectedOptions={[selectedDefinition?.name]}
            disabled={!apiDefinitions.list.length}
            onOptionSelect={handleDefinitionSelect}
          >
            {apiDefinitions.list.map((definition) => (
              <Option key={definition.name} value={definition.name}>
                {definition.title}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.selectionDropdown}>
          <label htmlFor="deployment-select">Deployment</label>
          <Dropdown
            id="deployment-select"
            placeholder="Select deployment"
            value={selectedDeployment?.title || NO_DEPLOYMENT_LABEL}
            selectedOptions={[selectedDeployment?.name]}
            disabled={!apiDeployments.list.length}
            onOptionSelect={handleDeploymentSelect}
          >
            {apiDeployments.list.map((deployment) => (
              <Option key={deployment.name} value={deployment.name}>
                {deployment.title}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.tabsContainer}>
          <TabList selectedValue={activeTab} onTabSelect={handleTabSelect}>
            <Tab value={Tabs.OPTIONS}>Options</Tab>
            <Tab value={Tabs.MORE_DETAILS}>More about this API</Tab>
          </TabList>
          <Divider />
        </div>

        {renderSelectedTabContent()}
      </>
    );
  }

  return (
    <Drawer className={styles.apiInfo} size="medium" position="end" open>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={() => console.log('close')}
            />
          }
        >
          {api.data?.title}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>{renderContent()}</DrawerBody>
    </Drawer>
  );
};

export default React.memo(ApiInfo);
