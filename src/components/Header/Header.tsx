import React, { useEffect, useState } from "react";
import { Link, Text } from "@fluentui/react-components";
import LogoSvg from "@/assets/logo.svg";
import AuthBtn from "@/components/Header/AuthBtn";
import LocationsService from "@/services/LocationsService";
import styles from "./Header.module.scss";
import { getRecoil } from "recoil-nexus";
import appServicesAtom from "@/atoms/appServicesAtom";

const Header: React.FC = () => {
    const [headingTitle, setHeadingTitle] = useState("API portal");

    useEffect(() => {
        const { ConfigService } = getRecoil(appServicesAtom);
        ConfigService.getSettings().then((settings) => {
            setHeadingTitle(settings.title);
        });
    }, [headingTitle]);

    return (
        <header className={styles.header}>
            <Link href={LocationsService.getHomeUrl()} className={styles.logo}>
                <img src={LogoSvg} alt={headingTitle} />
                <Text size={400} weight="semibold">
                    {headingTitle}
                </Text>
            </Link>
            <nav className={styles.navLinks}>
                <Link appearance="subtle" href={LocationsService.getHomeUrl()}>
                    APIs
                </Link>

                <Link
                    appearance="subtle"
                    href={LocationsService.getHelpUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Help
                </Link>
            </nav>

            <AuthBtn />
        </header>
    );
};

export default React.memo(Header);
