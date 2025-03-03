import React, { useCallback, useState } from 'react';
import {
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Spinner,
  Subtitle2,
  Tab,
  TabList,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { useNavigate, useParams } from 'react-router-dom';
import useApi from '@/hooks/useApi';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import ApiAdditionalInfo from '../../experiences/ApiAdditionalInfo';
import ApiInfoOptions from '../../experiences/ApiInfoOptions';
import LocationsService from '@/services/LocationsService';
import ApiDefinitionSelect, { ApiDefinitionSelection } from '@/experiences/ApiDefinitionSelect';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import styles from './ApiInfo.module.scss';

interface RouteParams {
  id: string;
}

enum Tabs {
  OPTIONS = 'options',
  MORE_DETAILS = 'more-details',
}

export const ApiInfo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.OPTIONS);
  const [definitionSelection, setDefinitionSelection] = useState<ApiDefinitionSelection | undefined>(undefined);

  const { id } = useParams() as Readonly<RouteParams>;
  const navigate = useNavigate();
  const api = useApi(id);

  useDocumentTitle(`API Info${api.data?.title ? ` - ${api.data.title}` : ''}`);

  const handleTabSelect = useCallback<React.ComponentProps<typeof TabList>['onTabSelect']>((_, { value }) => {
    setActiveTab(value as Tabs);
  }, []);

  const handleClose = useCallback(() => {
    navigate(LocationsService.getHomeUrl(true));
  }, [navigate]);

  function renderSelectedTabContent() {
    if (activeTab === Tabs.OPTIONS) {
      return (
        <ApiInfoOptions
          api={api.data}
          apiVersion={definitionSelection?.version}
          apiDefinition={definitionSelection?.definition}
          apiDeployment={definitionSelection?.deployment}
          isLoading={api.isLoading || !definitionSelection}
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
      return <EmptyStateMessage>The specified API does not exist</EmptyStateMessage>;
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

        <ApiDefinitionSelect apiId={id} onSelectionChange={setDefinitionSelection} />

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
    <Drawer className={styles.apiInfo} size="medium" position="end" open onOpenChange={handleClose}>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={() => {
                document.title = 'API Center portal'; // Reset title to default
                handleClose();
              }}
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
