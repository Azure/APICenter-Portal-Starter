import React from 'react';
import { ApiOperationMethod, CopyToClipboard, InfoPanel } from '@microsoft/api-docs-ui';
import { resolveOpUrlTemplate } from '@/utils/apiOperations';
import { OperationTypes } from '@/types/apiSpec';
import { OperationDetailsViewProps } from './types';
import McpResourceOperationDetails from './McpResourceOperationDetails';
import DefaultOperationDetails from './DefaultOperationDetails';
import styles from './ApiOperationDetails.module.scss';

type DetailsViewType = React.NamedExoticComponent<OperationDetailsViewProps>;

const detailsViewByType: Record<OperationTypes, DetailsViewType> = {
  [OperationTypes.DEFAULT]: DefaultOperationDetails,
  [OperationTypes.MCP_RESOURCE]: McpResourceOperationDetails,
};

export const ApiOperationDetails: React.FC<OperationDetailsViewProps> = (props) => {
  const { apiSpec, operation, deployment } = props;

  const urlTemplate = resolveOpUrlTemplate(apiSpec, operation, deployment);

  const DetailsView = detailsViewByType[operation?.type];

  if (!operation) {
    return null;
  }

  return (
    <div className={styles.apiOperationDetails}>
      <h1>{operation.displayName}</h1>

      {!!operation.description && <p className={styles.description}>{operation.description}</p>}

      <InfoPanel className={styles.infoPanel} title="Endpoint">
        <div className={styles.infoPanelContent}>
          <span className={styles.url}>
            <ApiOperationMethod method={operation.method} /> {urlTemplate}
          </span>

          <CopyToClipboard content={urlTemplate} />
        </div>
      </InfoPanel>

      <DetailsView {...props} />
    </div>
  );
};

export default React.memo(ApiOperationDetails);
