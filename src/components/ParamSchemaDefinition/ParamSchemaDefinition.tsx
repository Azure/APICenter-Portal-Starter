import React from 'react';
import { ParametersTable } from '@microsoft/api-docs-ui';
import { Badge } from '@fluentui/react-components';
import { SchemaMetadata } from '@/types/apiSpec';
import RefLink from '@/components/RefLink';
import { getRefLabel } from '@/utils/openApi';
import styles from './ParamSchemaDefinition.module.scss';

interface Props {
  title: string;
  schema?: SchemaMetadata;
  hiddenColumns?: React.ComponentProps<typeof ParametersTable>['hiddenColumns'];
  isGlobalDefinition?: boolean;
  isEnum?: boolean;
}

export const ParamSchemaDefinition: React.FC<Props> = ({
  title,
  schema,
  hiddenColumns = ['in'],
  isGlobalDefinition = false,
  isEnum = false,
}) => {
  if (!schema) {
    return null;
  }

  function renderTitle() {
    let typeLabel = null;
    if (!schema.properties?.length) {
      typeLabel = (
        <Badge className={styles.badge} appearance="tint" color="informative" shape="rounded">
          {schema.typeLabel}
        </Badge>
      );
    }

    if (isGlobalDefinition) {
      return (
        <h4 id={getRefLabel(schema.$ref)}>
          <RefLink className={styles.anchor} $ref={schema.$ref}>
            #
          </RefLink>
          {getRefLabel(schema.$ref)}:{typeLabel}
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
        :{typeLabel}
      </h4>
    );
  }

  function renderSchema() {
    if (!schema.properties?.length) {
      return;
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
      {renderSchema()}
    </div>
  );
};

export default React.memo(ParamSchemaDefinition);
