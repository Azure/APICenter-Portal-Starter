import React from 'react';
import { ApiOperationMethod, CopyToClipboard, InfoPanel } from 'api-docs-ui';
import { resolveOpUrlTemplate } from '@/utils/apiOperations';
import { useApiVersions } from '@/hooks/useApiVersions';
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
  const { definitionId, operation, deployment } = props;

  const apiVersions = useApiVersions(definitionId.apiName);
  const selectedVersion = apiVersions.data?.find((v) => v.name === definitionId.versionName);
  const versionTitle = selectedVersion?.title === 'Original' ? '' : (selectedVersion?.title || definitionId.versionName);
  const urlTemplate = resolveOpUrlTemplate(operation, deployment, versionTitle);

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
