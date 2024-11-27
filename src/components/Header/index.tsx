import { useEffect, useState } from "react";
import { Button, Link, Text } from "@fluentui/react-components";

import { Settings } from "../../contracts/settings";
import { useAuthService } from "../../util/useAuthService";
import { useConfigService } from "../../util/useConfigService";
import { LocalStorageKey, useLocalStorage } from "../../util/useLocalStorage";
import { useSession } from "../../util/useSession";
import CloverLogo from "../logos/CloverLogo";

import css from "./index.module.scss";

const Header = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const dataApiEndpoint = useLocalStorage(LocalStorageKey.dataApiEndpoint);
    const dataApiClientId = useLocalStorage(LocalStorageKey.dataApiClientId);
    const dataApiTenantId = useLocalStorage(LocalStorageKey.dataApiTenantId);
    const [config, setConfig] = useState<Settings>();
    const configService = useConfigService();
    const authService = useAuthService();
    const session = useSession();
    
    const fetchConfig = async () => {
        const config = await configService.getSettings();
        setConfig(config);
        dataApiEndpoint.set(config.dataApiHostName);
        dataApiClientId.set(config.authentication.clientId);
        dataApiTenantId.set(config.authentication.tenantId);
        const isAuthenticatedResponse = await authService.isAuthenticated();
        setIsAuthenticated(isAuthenticatedResponse);
    };

    const signIn = async () => {
        await authService.signIn();
        session.setAuthenticated(true);
        setIsAuthenticated(true);
    };

    const signOut = async () => {
        await authService.signOut();
        session.setAuthenticated(false);
        setIsAuthenticated(false);
        // Refresh the URL to the original state
        window.location.href = window.location.origin;
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <header>
            <div className={css.logo}>
                <CloverLogo />
                {!!config && (
                    <Text size={400} weight={"semibold"}>
                        {config.title}
                    </Text>
                )}
            </div>
            <div className={css.headerRight}>
                <div className={css.headerLinks}>
                    <Link appearance={"subtle"} href={"/"}>
                        Home
                    </Link>
                    <Link
                        appearance={"subtle"}
                        href={"https://learn.microsoft.com/en-us/azure/api-center/overview"}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                    >
                        Help
                    </Link>
                </div>
                <div className={css.signupButtonWrapper}>
                    <Button
                        appearance={"primary"}
                        style={{
                            backgroundColor: css.blueButton,
                            minWidth: "unset",
                        }}
                        onClick={() => {
                            isAuthenticated ? signOut() : signIn();
                        }}
                    >
                        {isAuthenticated ? "Sign out" : "Sign in"}
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;