import React from 'react';
import { Link, Text } from '@fluentui/react-components';
import { useRecoilValue } from 'recoil';
import LogoSvg from '@/assets/logo.svg';
import AuthBtn from '@/components/Header/AuthBtn';
import LocationsService from '@/services/LocationsService';
import configAtom from '@/atoms/configAtom';
import styles from './Header.module.scss';

const Header: React.FC = () => {
  const config = useRecoilValue(configAtom);

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

      <AuthBtn />
    </header>
  );
};

export default React.memo(Header);
