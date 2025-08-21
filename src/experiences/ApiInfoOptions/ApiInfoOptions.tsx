import React, { useCallback, useMemo } from 'react';
import { Button, Link, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';
import { ArrowDownloadRegular, Document20Regular, Link20Regular, OpenRegular } from '@fluentui/react-icons';
import { useRecoilValue } from 'recoil';
import DevPortalLogo from '@/assets/devPortal.png';
import { ApiMetadata } from '@/types/api';
import { ApiVersion } from '@/types/apiVersion';
import { ApiDefinition } from '@/types/apiDefinition';
import useApiSpecUrl from '@/hooks/useApiSpecUrl';
import useDeploymentEnvironment from '@/hooks/useDeploymentEnvironment';
import { ApiDeployment } from '@/types/apiDeployment';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';
import VSCInsiders from '@/assets/vsCodeInsidersLogo.svg';
import LocationsService from '@/services/LocationsService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CopyLink from '@/components/CopyLink';
import configAtom from '@/atoms/configAtom';
import styles from './ApiInfoOptions.module.scss';

interface Props {
  api: ApiMetadata;
  apiVersion?: ApiVersion;
  apiDefinition?: ApiDefinition;
  apiDeployment?: ApiDeployment;
  isLoading?: boolean;
}

const vscodetype = {
  stable: 'vscode',
  insiders: 'vscode-insiders',
}

const DEFAULT_INSTRUCTIONS = 'Gain comprehensive insights into the API.';

export const ApiInfoOptions: React.FC<Props> = ({ api, apiVersion, apiDefinition, apiDeployment, isLoading }) => {
  const config = useRecoilValue(configAtom);

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

  const devPortalUri = environment.data?.onboarding?.developerPortalUri?.[0];

  const handleOpenInVsCodeClick = useCallback((vscodetype) => {
    if (!config.authentication) {
      console.warn('Cannot open in VS Code: authentication configuration is not available');
      return;
    }
    const link = `${vscodetype}://apidev.azure-api-center?clientId=${config.authentication.clientId}&tenantId=${config.authentication.tenantId}&runtimeUrl=${config.dataApiHostName}`;
    window.open(link);
  }, [config]);

  const handleInstallMcpInVsCodeClick = useCallback((vscodetype, obj) => {
    const link = `${vscodetype}:mcp/install?${encodeURIComponent(JSON.stringify(obj))}`;
    window.open(link);
  }, [config]);

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
            <span className={styles.panelLabel}>
              <Document20Regular /> <strong>API Definition</strong>
            </span>

            {apiSpecUrl.value && api.kind !== 'mcp' && (
              <span className={styles.linkGroup}>
                <Link href={apiSpecUrl.value} className={styles.link}>
                  Download <ArrowDownloadRegular />
                </Link>

                <Link
                  className={styles.link}
                  href={LocationsService.getApiSchemaExplorerUrl(api.name, apiVersion.name, apiDefinition.name)}
                >
                  View documentation
                </Link>
              </span>
            )}
          </h5>

          <p>This file defines how to use the API, including the endpoints, policies, authentication, and responses.</p>

          <p>
            <Button size="medium" className={styles.actionButton} icon={<img src={VsCodeLogo} alt="VS Code" />} onClick={() => handleOpenInVsCodeClick(vscodetype.stable)}>
              Open in Visual Studio Code
            </Button>
          </p>
          <p>
            <Button size="medium" className={styles.actionButton} icon={<img src={VSCInsiders} alt="VS Code Insider" />} onClick={() => handleOpenInVsCodeClick(vscodetype.insiders)}>
              Open in Visual Studio Code Insider
            </Button>
          </p>
        </div>

        {!!apiDeployment?.server.runtimeUri.length && (
          <div className={styles.section}>
            <h5>
              <span className={styles.panelLabel}>
                <Link20Regular /> <strong>Endpoint URL</strong>
              </span>

              <CopyLink className={styles.link} url={apiDeployment.server.runtimeUri[0]}>
                Copy URL
              </CopyLink>
            </h5>

            <p>Use this URL to send requests to the API&apos;s server.</p>
          </div>
        )}

        {api.kind === 'mcp' && !!apiDeployment?.server.runtimeUri.length && (
          <div className={styles.section}>
            <h5>
              <span className={styles.panelLabel}>
                <img src={VsCodeLogo} alt="VS Code" />
                <strong>MCP Installation</strong>
              </span>
            </h5>

            <p>Install this Model Context Protocol (MCP) server in Visual Studio Code to enable AI-powered interactions with this API.</p>

            <p>
              <Button size="medium" className={styles.actionButton} icon={<img src={VsCodeLogo} alt="VS Code" />} onClick={() => handleInstallMcpInVsCodeClick(vscodetype.stable, { name: api.name, url: apiDeployment.server.runtimeUri[0] })}>
                Install in Visual Studio Code
              </Button>
            </p>

            <p>
              <Button size="medium" className={styles.actionButton} icon={<img src={VSCInsiders} alt="VS Code Insider" />} onClick={() => handleInstallMcpInVsCodeClick(vscodetype.insiders, { name: api.name, url: apiDeployment.server.runtimeUri[0] })}>
                Install in Visual Studio Code Insider
              </Button>
            </p>
          </div>
        )}

        {!!devPortalUri && (
          <div className={styles.section}>
            <h5>
              <span className={styles.panelLabel}>
                <img src={DevPortalLogo} alt="Developer portal" />
                <strong>{environment.data.title} developer portal</strong>
              </span>

              <CopyLink className={styles.link} url={devPortalUri}>
                Copy URL
              </CopyLink>

              <Link href={devPortalUri} target="_blank" className={styles.link}>
                Open in a new tab <OpenRegular />
              </Link>
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
