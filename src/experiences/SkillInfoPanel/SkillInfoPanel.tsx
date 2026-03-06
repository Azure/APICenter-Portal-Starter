import React, { useCallback, useState } from 'react';
import {
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Spinner,
  Tab,
  TabList,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { useRecoilState } from 'recoil';
import { useApi } from '@/hooks/useApi';
import { selectedSkillAtom } from '@/atoms/selectedSkillAtom';
import ApiAdditionalInfo from '@/experiences/ApiAdditionalInfo';
import ApiInfoOptions from '@/experiences/ApiInfoOptions';
import ApiDefinitionSelect, { ApiDefinitionSelection } from '@/experiences/ApiDefinitionSelect';
import { EmptyStateMessage } from '@/components/EmptyStateMessage/EmptyStateMessage';
import styles from './SkillInfoPanel.module.scss';

enum Tabs {
  OPTIONS = 'options',
  MORE_DETAILS = 'more-details',
}

export const SkillInfoPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.OPTIONS);
  const [definitionSelection, setDefinitionSelection] = useState<ApiDefinitionSelection | undefined>(undefined);
  const [selectedSkill, setSelectedSkill] = useRecoilState(selectedSkillAtom);
  const api = useApi(selectedSkill);

  const handleTabSelect = useCallback<React.ComponentProps<typeof TabList>['onTabSelect']>((_, { value }) => {
    setActiveTab(value as Tabs);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedSkill(null);
  }, [setSelectedSkill]);

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
      return <EmptyStateMessage>The specified skill does not exist.</EmptyStateMessage>;
    }

    return (
      <>
        <p className={styles.metadata}>Last update {new Date(api.data.lastUpdated).toLocaleDateString()}</p>

        <ApiDefinitionSelect
          apiId={selectedSkill}
          hiddenSelects={['version', 'definition', 'deployment']}
          onSelectionChange={setDefinitionSelection}
        />

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
    <Drawer className={styles.skillInfoPanel} size="medium" position="end" open={!!selectedSkill} onOpenChange={handleClose}>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={handleClose} />}
        >
          {api.data?.title}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>{selectedSkill && renderContent()}</DrawerBody>
    </Drawer>
  );
};

export default React.memo(SkillInfoPanel);
