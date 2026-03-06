import React, { useCallback } from 'react';
import { Button } from '@fluentui/react-components';
import { ArrowDownloadRegular } from '@fluentui/react-icons';
import VsCodeLogo from '@/assets/vsCodeLogo.svg';
import { buildSkillDeeplink, VsCodeVariant } from '@/utils/skillDeeplink';
import styles from './SkillInstallButton.module.scss';

interface SkillInstallButtonProps {
  /** The name of the skill (used in the deeplink) */
  skillName: string;
  /** The GitHub source URL for the skill folder */
  sourceUrl: string;
}

enum VsCodeTypes {
  Stable = 'vscode',
}

/**
 * Renders "Install in VS Code" buttons for a skill-type API.
 * Mirrors the MCP Installation section in ApiInfoOptions.
 */
export const SkillInstallButton: React.FC<SkillInstallButtonProps> = ({ skillName, sourceUrl }) => {
  const handleClick = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const variant = (e.currentTarget.value || VsCodeTypes.Stable) as VsCodeVariant;
      const deeplink = buildSkillDeeplink({ sourceUrl, name: skillName }, variant);
      window.open(deeplink);
    },
    [skillName, sourceUrl]
  );

  return (
    <div className={styles.skillInstall}>
      <h3>
        <span className={styles.panelLabel}>
          <ArrowDownloadRegular />
          <strong>Skill Installation</strong>
        </span>
      </h3>

      <p>
        Install this skill into your local workspace. The skill files will be downloaded from GitHub and placed in{' '}
        <code>.github/skills/{skillName}</code>.
      </p>

      <h4>Install in:</h4>
      <p className={styles.buttonGroup}>
        <Button
          size="medium"
          className={styles.actionButton}
          icon={<img height={18} src={VsCodeLogo} alt="VS Code" />}
          value={VsCodeTypes.Stable}
          onClick={handleClick}
        >
          Visual Studio Code
        </Button>
      </p>

      <p className={styles.hint}>
        Requires the{' '}
        <a href="vscode:extension/azure-api-center.apic-skill-installer">
          API Center Skill Installer
        </a>{' '}
        extension.{' '}
        <a href="vscode:extension/azure-api-center.apic-skill-installer">Click here to install it in VS Code</a>.
      </p>
    </div>
  );
};

export default SkillInstallButton;
