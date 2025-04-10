import React from 'react';
import { Spinner } from '@fluentui/react-components';
import useApiSpec from '@/hooks/useApiSpec';
import { ApiDefinitionId } from '@/types/apiDefinition';
import { ApiDeployment } from '@/types/apiDeployment';
import ApiSpecPageLayout from '../ApiSpecPageLayout';
import pageStyles from '../ApiSpec.module.scss';

interface Props {
  definitionId: ApiDefinitionId;
  deployment: ApiDeployment;
}

export const DefaultApiSpecPage: React.FC<Props> = ({ definitionId, deployment }) => {
  const apiSpec = useApiSpec(definitionId);

  if (apiSpec.isLoading) {
    return <Spinner className={pageStyles.spinner} />;
  }

  return <ApiSpecPageLayout definitionId={definitionId} deployment={deployment} apiSpec={apiSpec} />;
};

export default React.memo(DefaultApiSpecPage);
