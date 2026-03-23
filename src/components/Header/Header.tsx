import React from 'react';
import { Link, Text, Tooltip, ToggleButton } from '@fluentui/react-components';
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import LogoSvg from '@/assets/logo.svg';
import AuthBtn from '@/components/Header/AuthBtn';
import { LocationsService } from '@/services/LocationsService';
import { configAtom } from '@/atoms/configAtom';
import { isAnonymousAccessEnabledAtom } from '@/atoms/isAnonymousAccessEnabledAtom';
import { isDarkModeAtom } from '@/atoms/isDarkModeAtom';
import styles from './Header.module.scss';

const Header: React.FC = () => {
  const config = useRecoilValue(configAtom);
  const isAnonymousAccessEnabled = useRecoilValue(isAnonymousAccessEnabledAtom);
  const [isDarkMode, setIsDarkMode] = useRecoilState(isDarkModeAtom);

  return (
    <header className={styles.header}>
      <Link href={LocationsService.getHomeUrl()} className={styles.logo}>
        <img src={LogoSvg} alt={config.title} />
        <Text size={400} weight="semibold">
          {config.title}
        </Text>
      </Link>
      <nav className={styles.navLinks}>
        <Link appearance="subtle" href={LocationsService.getHomeUrl()}>
          APIs
        </Link>

        <Link appearance="subtle" href={LocationsService.getHelpUrl()} target="_blank" rel="noopener noreferrer">
          Help
        </Link>
      </nav>

      <div className={styles.actions}>
        <Tooltip content={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} relationship="label">
          <ToggleButton
            checked={isDarkMode}
            appearance="subtle"
            icon={isDarkMode ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
            onClick={() => setIsDarkMode(!isDarkMode)}
            size="small"
          />
        </Tooltip>

        {!isAnonymousAccessEnabled && (
          <div className={styles.auth}>
            <AuthBtn />
          </div>
        )}
      </div>
    </header>
  );
};

export default React.memo(Header);
