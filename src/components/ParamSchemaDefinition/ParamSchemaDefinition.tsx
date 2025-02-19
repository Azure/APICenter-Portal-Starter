import React, { useCallback, useState } from 'react';
import { ParametersTable, RawSchema } from '@microsoft/api-docs-ui';
import { Badge, Tab, TabList } from '@fluentui/react-components';
import { SchemaMetadata } from '@/types/apiSpec';
import RefLink from '@/components/RefLink';
import styles from './ParamSchemaDefinition.module.scss';

interface Props {
  title: string;
  schema?: SchemaMetadata;
  hiddenColumns?: React.ComponentProps<typeof ParametersTable>['hiddenColumns'];
  isGlobalDefinition?: boolean;
  isEnum?: boolean;
}

enum DefinitionTabs {
  TABLE = 'table',
  SCHEMA = 'schema',
}

export const ParamSchemaDefinition: React.FC<Props> = ({
  title,
  schema,
  hiddenColumns = ['in'],
  isGlobalDefinition = false,
  isEnum = false,
}) => {
  const [selectedTab, setSelectedTab] = useState<DefinitionTabs>(DefinitionTabs.TABLE);

  const handleTabSelect = useCallback<React.ComponentProps<typeof TabList>['onTabSelect']>((_, { value }) => {
    setSelectedTab(value as DefinitionTabs);
  }, []);

  if (!schema) {
    return null;
  }

  function renderTitle() {
    if (isGlobalDefinition) {
      return (
        <h4 id={schema.refLabel}>
          <RefLink className={styles.anchor} $ref={schema.$ref}>
            #
          </RefLink>
          {schema.refLabel}:
        </h4>
      );
    }

    return (
      <h4>
        {title}
        {schema.$ref && (
          <>
            {' '}
            (<RefLink $ref={schema.$ref} />)
          </>
        )}
        :
      </h4>
    );
  }

  function renderDefinition() {
    if (selectedTab === DefinitionTabs.SCHEMA) {
      const title = schema.refLabel || 'Schema';

      return (
        <RawSchema
          title={`${title} (${schema.rawSchemaLanguage})`}
          schema={schema.rawSchema}
          language={schema.rawSchemaLanguage}
        />
      );
    }

    if (!schema.properties?.length) {
      return (
        <>
          Type:
          <Badge className={styles.badge} appearance="tint" color="informative" shape="rounded">
            {schema.typeLabel}
          </Badge>
        </>
      );
    }

    return (
      <>
        {isEnum && <h5>Enum values:</h5>}
        <ParametersTable parameters={schema.properties} hiddenColumns={hiddenColumns} />
      </>
    );
  }

  return (
    <div className={styles.paramSchemaDefinition}>
      {renderTitle()}

      {!!schema.rawSchema && (
        <TabList className={styles.tabList} selectedValue={selectedTab} onTabSelect={handleTabSelect}>
          <Tab value={DefinitionTabs.TABLE}>{schema.properties?.length ? 'Table' : 'Definition'}</Tab>
          <Tab value={DefinitionTabs.SCHEMA}>Schema</Tab>
        </TabList>
      )}

      {renderDefinition()}
    </div>
  );
};

export default React.memo(ParamSchemaDefinition);
