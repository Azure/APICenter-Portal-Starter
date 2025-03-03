import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ParametersTable, RawSchema } from '@microsoft/api-docs-ui';
import { Badge, Dropdown, Label, Option, Tab, TabList } from '@fluentui/react-components';
import { MediaContentMetadata, SchemaMetadata } from '@/types/apiSpec';
import RefLink from '@/components/RefLink';
import styles from './ParamSchemaDefinition.module.scss';

interface Props {
  title: string;
  schema?: SchemaMetadata;
  mediaContentList?: MediaContentMetadata[];
  hiddenColumns?: React.ComponentProps<typeof ParametersTable>['hiddenColumns'];
  isGlobalDefinition?: boolean;
  isEnum?: boolean;
}

enum DefinitionTabs {
  TABLE = 'table',
  SCHEMA = 'schema',
  SAMPLE = 'sample',
}

/**
 * A component that renders a parameter schema definition.
 * It can render a table with parameter properties or a raw schema based on user selection.
 * It supports two modes:
 *   1. Single schema mode that can be used for singular schemas (for example in definitions)
 *   2. Multiple media content mode that can be used for request/response bodies with multiple content types.
 */
export const ParamSchemaDefinition: React.FC<Props> = ({
  title,
  schema: inputSchema,
  mediaContentList,
  hiddenColumns = ['in'],
  isGlobalDefinition = false,
  isEnum = false,
}) => {
  const [selectedTab, setSelectedTab] = useState<DefinitionTabs>(DefinitionTabs.TABLE);
  const [selectedMediaContent, setSelectedMediaContent] = useState<MediaContentMetadata | undefined>(
    mediaContentList?.[0]
  );

  useEffect(() => {
    setSelectedMediaContent(mediaContentList?.[0]);
  }, [mediaContentList]);

  const schema = useMemo(() => {
    if (selectedMediaContent) {
      return selectedMediaContent.schema;
    }
    return inputSchema;
  }, [inputSchema, selectedMediaContent]);

  const handleTabSelect = useCallback<React.ComponentProps<typeof TabList>['onTabSelect']>((_, { value }) => {
    setSelectedTab(value as DefinitionTabs);
  }, []);

  const handleMediaTypeChange = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, { optionValue }) => {
      const mediaContent = mediaContentList!.find((mediaContent) => mediaContent.type === optionValue);
      setSelectedMediaContent(mediaContent);

      if (selectedTab === DefinitionTabs.SCHEMA && !mediaContent.schema.rawSchema) {
        setSelectedTab(DefinitionTabs.TABLE);
      }

      if (selectedTab === DefinitionTabs.SAMPLE && !mediaContent.sampleData) {
        setSelectedTab(DefinitionTabs.TABLE);
      }
    },
    [mediaContentList, selectedTab]
  );

  const shouldShowContentTypeSelect = mediaContentList?.length;
  const shouldShowTabsRow = !!schema?.rawSchema || selectedMediaContent?.sampleData || shouldShowContentTypeSelect;

  if (inputSchema && mediaContentList) {
    console.warn('Both schema and mediaContentList are provided. mediaContentList will be used by default.');
  }

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
          title={`${title} (${schema.rawSchema.language})`}
          schema={schema.rawSchema.schema}
          language={schema.rawSchema.language}
        />
      );
    }

    if (selectedTab === DefinitionTabs.SAMPLE && selectedMediaContent?.sampleData) {
      return (
        <RawSchema
          title={`Sample data (${selectedMediaContent.sampleData.language})`}
          schema={selectedMediaContent.sampleData.data}
          language={selectedMediaContent.sampleData.language}
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

      {shouldShowTabsRow && (
        <div className={styles.tabListWrapper}>
          <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
            <Tab value={DefinitionTabs.TABLE}>{schema.properties?.length ? 'Table' : 'Definition'}</Tab>
            {schema.rawSchema && <Tab value={DefinitionTabs.SCHEMA}>Schema</Tab>}
            {selectedMediaContent?.sampleData && <Tab value={DefinitionTabs.SAMPLE}>Sample data</Tab>}
          </TabList>

          {shouldShowContentTypeSelect && (
            <Label className={styles.contentTypeSelect}>
              <span>Content type</span>
              <Dropdown
                className={styles.dropdown}
                value={selectedMediaContent?.type}
                selectedOptions={[selectedMediaContent?.type]}
                size="small"
                onOptionSelect={handleMediaTypeChange}
              >
                {mediaContentList.map((mediaContent) => (
                  <Option key={mediaContent.type} className={styles.contentTypeSelectOption}>
                    {mediaContent.type}
                  </Option>
                ))}
              </Dropdown>
            </Label>
          )}
        </div>
      )}

      {renderDefinition()}
    </div>
  );
};

export default React.memo(ParamSchemaDefinition);
