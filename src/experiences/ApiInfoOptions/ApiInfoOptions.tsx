import React, { useCallback, useMemo } from 'react';
import { Button, Link, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components';
import { ArrowDownloadRegular, Document20Regular, Link20Regular, OpenRegular } from '@fluentui/react-icons';
import { useRecoilValue } from 'recoil';
import DevPortalLogo from '@/assets/devPortal.png';
import { ApiMetadata } from '@/types/api';
import { ApiVersion } from '@/types/apiVersion';
import { ApiDefinition } from '@/types/apiDefinition';
import { useApiSpecUrl } from '@/hooks/useApiSpecUrl';
import { useDeploymentEnvironment } from '@/hooks/useDeploymentEnvironment';
import { ApiDeployment } from '@/types/apiDeployment';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';
import { LocationsService } from '@/services/LocationsService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CopyLink from '@/components/CopyLink';
import { configAtom } from '@/atoms/configAtom';
import { useServer } from '@/hooks/useServer';
import { SkillInstallButton } from '@/experiences/SkillInstallButton';
import styles from './ApiInfoOptions.module.scss';

/**
 * Extracts the `sourceUrl` for a skill-type API from its custom properties.
 */
function getSkillSourceUrl(api: ApiMetadata): string | undefined {
  return api.customProperties?.['sourceUrl'] as string | undefined;
}

interface Props {
  api: ApiMetadata;
  apiVersion?: ApiVersion;
  apiDefinition?: ApiDefinition;
  apiDeployment?: ApiDeployment;
  isLoading?: boolean;
}

enum VsCodeTypes {
  Stable = 'vscode',
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
  const server = useServer(api.name);
  const skillSourceUrl = useMemo(() => getSkillSourceUrl(api), [api]);

  const devPortalUri = environment.data?.onboarding?.developerPortalUri?.[0];

  const handleOpenInVsCodeClick = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const vsCodeType = e.currentTarget.value || VsCodeTypes.Stable;
      if (!config.authentication) {
        console.warn('Cannot open in VS Code: authentication configuration is not available');
        return;
      }
      // TODO: check it for anonymous access
      const link = `${vsCodeType}://apidev.azure-api-center?clientId=${config.authentication.clientId}&tenantId=${config.authentication.tenantId}&runtimeUrl=${config.dataApiHostName}`;
      window.open(link);
    },
    [config]
  );

  const handleInstallMcpInVsCodeClick = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const vsCodeType = e.currentTarget.value || VsCodeTypes.Stable;
      const isLocal = e.currentTarget.getAttribute('data-local') === 'true';

      let payload: Record<string, unknown>;

      if (isLocal) {
        const [pkg] = server.data.packages!;
        if (!pkg) {
          return;
        }

        const runtimeArgs = pkg.runtimeArguments.map((arg) => arg.value);
        const args = pkg.runtimeHint === 'npx' ? ['-y', pkg.identifier, ...runtimeArgs] : runtimeArgs;

        payload = {
          name: api.title || pkg.identifier.split('/').pop() || pkg.identifier,
          type: pkg.transport?.type || 'stdio',
          command: pkg.runtimeHint,
          args,
        };
      } else {
        const runtimeUri = apiDeployment?.server.runtimeUri[0];
        if (!runtimeUri) return;

        const matchingRemote = server.data?.remotes?.find((r) => r.url === runtimeUri);
        const transportType = matchingRemote?.transport_type || 'sse';

        payload = {
          name: api.title || api.name,
          type: transportType,
          url: runtimeUri,
        };
      }

      window.open(`${vsCodeType}:mcp/install?${encodeURIComponent(JSON.stringify(payload))}`);
    },
    [api.name, apiDeployment?.server.runtimeUri, server.data]
  );

  function renderContent() {
    if (isLoading || apiSpecUrl.isLoading || environment.isLoading || server.isLoading) {
      return <Spinner size="small" />;
    }

    const hasMcpInstallableContent = api.kind === 'mcp' && (!!apiDeployment?.server.runtimeUri.length || !!server.data?.packages);

    if ((!apiVersion || !apiDefinition) && !hasMcpInstallableContent) {
      return (
        <MessageBar>
          <MessageBarBody>There are no available options for this API.</MessageBarBody>
        </MessageBar>
      );
    }

    return (
      <>
        {apiVersion && apiDefinition && (
        <div className={styles.section}>
          <h3>
            <span className={styles.panelLabel}>
              <Document20Regular /> <strong>API Definition</strong>
            </span>

            {api.kind !== 'skill' && (
              <span className={styles.linkGroup}>
                {apiSpecUrl.data && api.kind !== 'mcp' && (
                  <Link href={apiSpecUrl.data} className={styles.link}>
                    Download <ArrowDownloadRegular />
                  </Link>
                )}

                {(api.kind !== 'mcp' || !!server.data?.remotes?.length) && (
                  <Link
                    className={styles.link}
                    href={LocationsService.getApiSchemaExplorerUrl(api.name, apiVersion.name, apiDefinition.name)}
                  >
                    View documentation
                  </Link>
                )}
              </span>
            )}
          </h3>

          <p>This file defines how to use the API, including the endpoints, policies, authentication, and responses.</p>

          {config.authentication && (
            <>
              <h4>Open in:</h4>
              <p className={styles.buttonGroup}>
                <Button
                  size="medium"
                  className={styles.actionButton}
                  icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
                  value={VsCodeTypes.Stable}
                  onClick={handleOpenInVsCodeClick}
                >
                  Visual Studio Code
                </Button>
              </p>
            </>
          )}
        </div>
        )}

        {!!apiDeployment?.server.runtimeUri.length && (
          <div className={styles.section}>
            <h3>
              <span className={styles.panelLabel}>
                <Link20Regular /> <strong>Endpoint URL</strong>
              </span>

              <CopyLink className={styles.link} url={apiDeployment.server.runtimeUri[0]}>
                Copy URL
              </CopyLink>
            </h3>

            <p>Use this URL to send requests to the API&apos;s server.</p>
          </div>
        )}

        {hasMcpInstallableContent && (
          <div className={styles.section}>
            <h3>
              <span className={styles.panelLabel}>
                <img src={VsCodeLogo} alt="VS Code" />
                <strong>MCP Installation</strong>
              </span>
            </h3>

            <p>
              Install this Model Context Protocol (MCP) server in Visual Studio Code to enable AI-powered interactions
              with this API.
            </p>

            <h4>Install in:</h4>
            <p className={styles.buttonGroup}>
              {!!apiDeployment?.server.runtimeUri.length && (
                <Button
                  size="medium"
                  className={styles.actionButton}
                  icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
                  value={VsCodeTypes.Stable}
                  onClick={handleInstallMcpInVsCodeClick}
                >
                  Visual Studio Code{!!server.data?.packages && ' (remote)'}
                </Button>
              )}

              {!!server.data?.packages && (
                <Button
                  size="medium"
                  className={styles.actionButton}
                  icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
                  value={VsCodeTypes.Stable}
                  data-local="true"
                  onClick={handleInstallMcpInVsCodeClick}
                >
                  Visual Studio Code{!!apiDeployment?.server.runtimeUri.length && ' (local)'}
                </Button>
              )}
            </p>
          </div>
        )}

        {api.kind === 'skill' && skillSourceUrl && (
          <div className={styles.section}>
            <SkillInstallButton skillName={api.name} sourceUrl={skillSourceUrl} />
          </div>
        )}

        {api.kind === 'skill' && skillSourceUrl && (
          <div className={styles.section}>
            <h3>
              <span className={styles.panelLabel}>
                <Link20Regular />
                <strong>Source Repository</strong>
              </span>

              <Link href={skillSourceUrl} target="_blank" className={styles.link}>
                Open on GitHub <OpenRegular />
              </Link>
            </h3>

            <p>Browse the skill source code and files on GitHub.</p>
          </div>
        )}

        {!!devPortalUri && (
          <div className={styles.section}>
            <h3>
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
            </h3>

            <MarkdownRenderer markdown={environment.data.onboarding.instructions || DEFAULT_INSTRUCTIONS} />
          </div>
        )}
      </>
    );
  }

  return <div className={styles.apiInfoOptions}>{renderContent()}</div>;
};

export default React.memo(ApiInfoOptions);
