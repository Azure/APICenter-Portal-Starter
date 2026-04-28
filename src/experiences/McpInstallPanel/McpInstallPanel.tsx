import React, { useCallback } from 'react';
import { Button } from '@fluentui/react-components';
import { ArrowDownloadRegular } from '@fluentui/react-icons';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';
import { useServer } from '@/hooks/useServer';
import { ApiDeployment } from '@/types/apiDeployment';
import styles from './McpInstallPanel.module.scss';

interface McpInstallPanelProps {
  apiName: string;
  apiTitle?: string;
  deployment?: ApiDeployment;
}

enum VsCodeTypes {
  Stable = 'vscode',
}

export const McpInstallPanel: React.FC<McpInstallPanelProps> = ({ apiName, apiTitle, deployment }) => {
  const server = useServer(apiName);

  const hasRemoteInstall = !!deployment?.server.runtimeUri.length;
  const hasLocalInstall = !!server.data?.packages;
  const hasMcpContent = hasRemoteInstall || hasLocalInstall;

  const handleInstall = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const vsCodeType = (e.currentTarget.value || VsCodeTypes.Stable) as string;
      const isLocal = e.currentTarget.getAttribute('data-local') === 'true';

      let payload: Record<string, unknown>;

      if (isLocal) {
        const [pkg] = server.data!.packages!;
        if (!pkg) return;

        const runtimeArgs = (pkg.runtimeArguments ?? []).map((arg) => arg.value);
        const packageRef = pkg.version ? `${pkg.identifier}@${pkg.version}` : pkg.identifier;
        const args = pkg.runtimeHint === 'npx' ? ['-y', packageRef, ...runtimeArgs] : runtimeArgs;

        const baseName = apiTitle || pkg.identifier.split('/').pop() || pkg.identifier;
        payload = {
          name: hasRemoteInstall ? `${baseName} (local)` : baseName,
          type: pkg.transport?.type || 'stdio',
          command: pkg.runtimeHint,
          args,
        };
      } else {
        const runtimeUri = deployment?.server.runtimeUri[0];
        if (!runtimeUri) return;

        const matchingRemote = server.data?.remotes?.find((r) => r.url === runtimeUri);
        const transportType = matchingRemote?.transport_type || 'sse';

        const baseName = apiTitle || apiName;
        payload = {
          name: hasLocalInstall ? `${baseName} (remote)` : baseName,
          type: transportType,
          url: runtimeUri,
        };
      }

      window.open(`${vsCodeType}:mcp/install?${encodeURIComponent(JSON.stringify(payload))}`);
    },
    [apiName, apiTitle, deployment?.server.runtimeUri, server.data, hasRemoteInstall, hasLocalInstall]
  );

  if (!hasMcpContent) return null;

  return (
    <div className={styles.mcpInstall}>
      <h3>
        <span className={styles.panelLabel}>
          <ArrowDownloadRegular />
          <strong>MCP Installation</strong>
        </span>
      </h3>

      <p>
        Install this Model Context Protocol (MCP) server in Visual Studio Code to enable AI-powered interactions
        with this API.
      </p>

      <h4>Install in:</h4>
      <p className={styles.buttonGroup}>
        {hasRemoteInstall && (
          <Button
            size="medium"
            className={styles.actionButton}
            icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
            value={VsCodeTypes.Stable}
            onClick={handleInstall}
          >
            Visual Studio Code{hasLocalInstall && ' (remote)'}
          </Button>
        )}

        {hasLocalInstall && (
          <Button
            size="medium"
            className={styles.actionButton}
            icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
            value={VsCodeTypes.Stable}
            data-local="true"
            onClick={handleInstall}
          >
            Visual Studio Code{hasRemoteInstall && ' (local)'}
          </Button>
        )}
      </p>

      <p className={styles.hint}>
        Requires the{' '}
        <a href="https://marketplace.visualstudio.com/items?itemName=apidev.azure-api-center">
          Azure API Center
        </a>{' '}
        extension.{' '}
        <a href="https://marketplace.visualstudio.com/items?itemName=apidev.azure-api-center">Click here to install it in VS Code</a>.
      </p>
    </div>
  );
};

export default McpInstallPanel;
