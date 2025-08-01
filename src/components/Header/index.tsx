import { Link, useNavigate } from "react-router-dom";
import { Text } from "@fluentui/react-components";
import { Link as FluentLink } from "@fluentui/react-components";

import ApicIcon from "../../media/apic-icon.svg";

import css from "./index.module.scss";

const Header = () => {
    const navigate = useNavigate();

    const handleLogoClick = () => {
        navigate("/");
    };

    return (
        <header>
            <div className={css.logo}>
                <button
                    onClick={handleLogoClick}
                    style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                    }}
                    aria-label={"Go to main page"}
                >
                    <img src={ApicIcon} alt={"API Center Icon"} style={{ width: "30px", height: "32px" }} />
                </button>
                <div style={{ marginLeft: "8px" }}>
                    <Text size={400} weight={"semibold"}>
                        MCP Center
                    </Text>
                    <div style={{ fontSize: "10px", color: "#666", marginTop: "-2px" }}>
                        powered by{" "}
                        <FluentLink
                            href={"https://learn.microsoft.com/azure/api-center/overview"}
                            target={"_blank"}
                            rel={"noopener noreferrer"}
                            style={{ fontSize: "10px", textDecoration: "none" }}
                        >
                            Azure API Center
                        </FluentLink>
                    </div>
                </div>
            </div>
            <div className={css.headerRight}>
                <div className={css.headerLinks}>
                    <Link to={"/about"} className={css.headerLink}>
                        About
                    </Link>
                    <FluentLink
                        appearance={"subtle"}
                        href={"https://github.com/Azure/mcp-center"}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                        className={css.headerLink}
                    >
                        Onboard
                    </FluentLink>
                </div>
            </div>
        </header>
    );
};

export default Header;
