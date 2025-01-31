import React, { useCallback, useMemo } from 'react';
import { Button, Link, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';
import { ArrowDownloadRegular, Document20Regular, OpenRegular } from '@fluentui/react-icons';
import DevPortalLogo from '@/assets/devPortal.png';
import { ApiMetadata } from '@/types/api';
import { ApiVersion } from '@/types/apiVersion';
import { ApiDefinition } from '@/types/apiDefinition';
import useApiSpecUrl from '@/hooks/useApiSpecUrl';
import useDeploymentEnvironment from '@/hooks/useDeploymentEnvironment';
import { ApiDeployment } from '@/types/apiDeployment';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';
import LocationsService from '@/services/LocationsService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CopyLink from '@/components/CopyLink';
import styles from './ApiInfoOptions.module.scss';

interface Props {
  api: ApiMetadata;
  apiVersion?: ApiVersion;
  apiDefinition?: ApiDefinition;
  apiDeployment?: ApiDeployment;
  isLoading?: boolean;
}

const DEFAULT_INSTRUCTIONS = 'Gain comprehensive insights into the API.';

export const ApiInfoOptions: React.FC<Props> = ({ api, apiVersion, apiDefinition, apiDeployment, isLoading }) => {
  const definitionId = useMemo(
    () => ({
      apiName: api.name,
      versionName: apiVersion?.name,
      definitionName: apiDefinition?.name,
    }),
    [api.name, apiDefinition?.name, apiVersion?.name]
  );

  const apiSpecUrl = useApiSpecUrl(definitionId);
  const environment = useDeploymentEnvironment(apiDeployment?.environmentId);

  const handleOpenInVsCodeClick = useCallback(() => {
    window.open(`vscode:extension/apidev.azure-api-center`);
  }, []);

  function renderContent() {
    if (isLoading || apiSpecUrl.isLoading || environment.isLoading) {
      return <Spinner size="small" />;
    }

    if (!apiVersion || !apiDefinition) {
      return (
        <MessageBar>
          <MessageBarBody>There are no available options for this API.</MessageBarBody>
        </MessageBar>
      );
    }

    return (
      <>
        <div className={styles.section}>
          <h5>
            <Document20Regular /> <strong>API Definition</strong>
            {apiSpecUrl.value && (
              <>
                <Link href={apiSpecUrl.value} className={styles.link}>
                  Download <ArrowDownloadRegular />
                </Link>

                <Link
                  className={styles.link}
                  href={LocationsService.getApiSchemaExplorerUrl(api.name, apiVersion.name, apiDefinition.name)}
                >
                  View documentation
                </Link>
              </>
            )}
          </h5>

          <p>This file defines how to use the API, including the endpoints, policies, authentication, and responses.</p>

          <p>
            <Button icon={<img src={VsCodeLogo} alt="VS Code" />} onClick={handleOpenInVsCodeClick}>
              Open in Visual Studio Code
            </Button>
          </p>
        </div>

        {environment.data?.onboarding && (
          <div className={styles.section}>
            <h5>
              <img src={DevPortalLogo} alt="Developer portal" />
              <strong>{environment.data.title} developer portal</strong>
              {(environment.data.onboarding.developerPortalUri?.length ?? 0) > 0 && (
                <>
                  {environment.data.onboarding?.developerPortalUri?.length && (
                    <>
                      <CopyLink className={styles.link} url={environment.data.onboarding.developerPortalUri[0]}>
                        Copy URL
                      </CopyLink>
                      <Link
                        href={environment.data.onboarding.developerPortalUri[0]}
                        target="_blank"
                        className={styles.link}
                      >
                        Open in a new tab <OpenRegular />
                      </Link>
                    </>
                  )}
                </>
              )}
            </h5>

            <MarkdownRenderer markdown={environment.data.onboarding.instructions || DEFAULT_INSTRUCTIONS} />
          </div>
        )}
      </>
    );
  }

  return <div className={styles.apiInfoOptions}>{renderContent()}</div>;
};

export default React.memo(ApiInfoOptions);
