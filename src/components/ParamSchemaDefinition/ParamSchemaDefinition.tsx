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
}

export const ParamSchemaDefinition: React.FC<Props> = ({
  title,
  schema,
  hiddenColumns = ['in'],
  isGlobalDefinition = false,
}) => {
  if (!schema) {
    return null;
  }

  function renderTitle() {
    if (isGlobalDefinition) {
      return (
        <h4 id={getRefLabel(schema.$ref)}>
          <RefLink className={styles.anchor} $ref={schema.$ref}>
            #
          </RefLink>
          {getRefLabel(schema.$ref)}
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

  function renderSchema() {
    if (!schema.isObject || !schema.properties.length) {
      return (
        <>
          <strong>Type:</strong>
          <Badge className={styles.badge} appearance="tint" color="informative" shape="rounded">
            {schema.typeLabel}
          </Badge>
        </>
      );
    }

    return <ParametersTable parameters={schema.properties} hiddenColumns={hiddenColumns} />;
  }

  return (
    <div className={styles.paramSchemaDefinition}>
      {renderTitle()}
      {renderSchema()}
    </div>
  );
};

export default React.memo(ParamSchemaDefinition);
