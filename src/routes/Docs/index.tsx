/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@fluentui/react-components";
import { ArrowLeft16Filled } from "@fluentui/react-icons";

import css from "./index.module.scss";

// Define the navigation structure
const navItems = [
    {
        title: "Introduction",
        link: "#introduction",
    },
    {
        title: "Key benefits",
        link: "#key-benefits",
    },
    {
        title: "Partnership",
        link: "#partnership",
    },
    {
        title: "MCP registry spec",
        link: "#mcp-registry-spec",
    },
];

const Docs = () => {
    const [activeSection, setActiveSection] = useState("introduction");
    const [copyButtonText, setCopyButtonText] = useState("📋 Copy");
    const [isCopied, setIsCopied] = useState(false);
    const navigate = useNavigate();

    // Handle going back to main page
    const handleGoBack = () => {
        // Navigate to the root path which is the main page
        navigate("/");
    };

    // Handle scroll to update active section
    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll("section[id]");
            let currentActiveSection = "introduction";

            // Check if we're near the bottom of the page
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const isNearBottom = scrollTop + windowHeight >= documentHeight - 100;

            // If we're near the bottom, activate the last section
            if (isNearBottom) {
                const lastSection = sections[sections.length - 1] as HTMLElement;
                currentActiveSection = lastSection.id;
            } else {
                // Simple approach: find the section whose top is closest to being at the top of viewport
                let closestSection: Element | null = null;
                let smallestDistance = Infinity;

                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    const sectionTop = rect.top;
                    
                    // We want sections that are either:
                    // 1. Just entering the viewport from below (positive top, small value)
                    // 2. Already in viewport but not too far up (negative top, but not too negative)
                    if (sectionTop <= 200 && sectionTop >= -rect.height * 0.8) {
                        const distance = Math.abs(sectionTop - 100); // 100px from top is our "ideal" position
                        if (distance < smallestDistance) {
                            smallestDistance = distance;
                            closestSection = section;
                        }
                    }
                });

                if (closestSection) {
                    currentActiveSection = (closestSection as HTMLElement).id;
                }
            }

            setActiveSection(currentActiveSection);
        };

        // Run once on mount to set initial state
        handleScroll();

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <div className={css.docsContainer}>
            <aside className={css.sidebar}>
                <div className={css.sidebarContent}>
                    <div className={css.goBackWrapper}>
                        <Button
                            appearance={"subtle"}
                            icon={<ArrowLeft16Filled />}
                            onClick={handleGoBack}
                            className={css.goBackButton}
                        >
                            Go back
                        </Button>
                    </div>
                    {navItems.map((item, i) => (
                        <div key={i} className={css.navCategory}>
                            <a
                                href={item.link}
                                className={`${css.navLink} ${activeSection === item.link.substring(1) ? css.active : ""}`}
                                onClick={e => {
                                    // Prevent default behavior and handle scrolling manually
                                    e.preventDefault();
                                    const targetId = item.link.substring(1);
                                    const targetElement = document.getElementById(targetId);
                                    if (targetElement) {
                                        targetElement.scrollIntoView({ behavior: "smooth" });
                                        setActiveSection(targetId);
                                    }
                                }}
                            >
                                {item.title}
                            </a>
                        </div>
                    ))}
                </div>
            </aside>

            <main className={css.content}>
                <div className={css.contentHeader}>
                    <h1>Unlocking the power of MCP servers in your enterprise</h1>
                    <p>Learn how to discover, govern, and share MCP servers in your enterprise</p>
                </div>

                <section id={"introduction"}>
                    <h2>Introduction</h2>

                    <p>
                        As enterprises start using Model Context Protocol (MCP) servers to facilitate seamless
                        communication and integration with their different MCP hosts, a new challenge emerges:
                        effectively managing, discovering and sharing these critical MCP servers at scale. As the number
                        and variety of your MCP servers grow — whether built internally or by third-party vendors —
                        discovering, reusing, and governing them across your enterprise can become a significant hurdle.
                    </p>

                    <div className={css.highlight}>
                        <p>
                            <strong>Note:</strong>
                            <br />
                            This website is a live showcase demonstrating the capabilities of{" "}
                            <a
                                href={"https://learn.microsoft.com/azure/api-center/"}
                                target={"_blank"}
                                rel={"noopener noreferrer"}
                                className={css.partnerLink}
                            >
                                Azure API Center
                            </a>{" "}
                            for enterprises and developers. It serves as a marketing tool to highlight how you can use
                            our services to create a private, governed catalog of MCP servers. The MCP servers listed on
                            this page are part of a curated collection, reflecting the kind of trusted and verified
                            services that an enterprise can manage.
                        </p>
                    </div>
                </section>

                <section id={"key-benefits"}>
                    <h2>Key benefits</h2>

                    <div className={css.benefitsContainer}>
                        <div className={css.benefit}>
                            <h3>Centralize and streamline discovery</h3>
                            <p>
                                Break down silos with a single, searchable hub for all remote MCP servers in your
                                enterprise. Developers and AI engineers can quickly discover the capabilities they need,
                                no matter where they originated.
                            </p>
                        </div>

                        <div className={css.benefit}>
                            <h3>Accelerate innovation through reuse</h3>
                            <p>
                                Foster efficiency and collaboration by making existing MCP servers readily discoverable.
                                This encourages developers to reuse proven solutions, reducing development time and
                                speeding up the delivery of new AI applications.
                            </p>
                        </div>

                        <div className={css.benefit}>
                            <h3>Unified AI gateway</h3>
                            <p>
                                Gain unparalleled control over your AI ecosystem. Azure API Center integrates with our
                                AI gateway (proxy) to apply consistent standards, security, and access controls across
                                all your MCP servers. This ensures responsible deployment, mitigates risks, and helps
                                meet compliance requirements.
                            </p>
                        </div>

                        <div className={css.benefit}>
                            <h3>Seamlessly integrate across MCP hosts</h3>
                            <p>
                                Connect your MCP servers to leading AI development environments. Effortlessly expose and
                                manage these servers within popular MCP hosts like Copilot Studio, AI Foundry, and VS
                                Code. This simplifies the developer experience, making your curated servers easily
                                discoverable and consumable in the tools your teams already use.
                            </p>
                        </div>
                    </div>
                </section>

                <section id={"partnership"}>
                    <h2>Partner with us</h2>
                    <p>
                        Interested in becoming a partner and being featured on the MCP discovery page in Azure API
                        Center?{" "}
                    </p>
                    <div className={css.conclusion}>
                        <p>
                            We&apos;re actively looking for partners to expand Azure&apos;s remote MCP server ecosystem.
                            If you&apos;re interested in connecting with our business team to explore becoming an
                            officially featured partner, please check out our{" "}
                            <a
                                href={"https://github.com/Azure/mcp-center"}
                                target={"_blank"}
                                rel={"noopener noreferrer"}
                                className={css.partnerLink}
                            >
                                Partner
                            </a>{" "}
                            link.
                        </p>
                    </div>
                </section>

                <section id={"mcp-registry-spec"}>
                    <h2>MCP registry spec</h2>
                    <p>
                        Azure API Center now supports the open-source, community-driven {" "}
                        <a
                            href={"https://github.com/modelcontextprotocol/registry"}
                            target={"_blank"}
                            rel={"noopener noreferrer"}
                            className={css.partnerLink}
                        >
                            mcp registry spec
                        </a>
                        . To test this integration, configure{" "}
                        <a
                            href={"https://code.visualstudio.com/insiders/"}
                            target={"_blank"}
                            rel={"noopener noreferrer"}
                            className={css.partnerLink}
                        >
                            VS Code Insiders
                        </a>{" "}
                        as follows:
                    </p>
                    <div className={css.codeBlock}>
                        <ol>
                            <li>Open User Settings (JSON)</li>
                            <li>Add the following setting configuration:</li>
                        </ol>
                        
                        <div className={css.urlCopyContainer}>
                            <div className={css.urlBox}>
                                <pre>
                                    <code>
                                        {`{
    "chat.mcp.discovery.enabled": true,
    "chat.mcp.gallery.serviceUrl": "https://registry.mcp.azure.com/v0/servers",
    "chat.mcp.serverSampling": {}
}`}
                                    </code>
                                </pre>
                            </div>
                            <button
                                className={`${css.copyButton} ${isCopied ? css.copied : ""}`}
                                onClick={() => {
                                    navigator.clipboard.writeText(`{
    "chat.mcp.discovery.enabled": true,
    "chat.mcp.gallery.serviceUrl": "https://registry.mcp.azure.com/v0/servers",
    "chat.mcp.serverSampling": {}
}`);
                                    setCopyButtonText("✅ Copied!");
                                    setIsCopied(true);
                                    setTimeout(() => {
                                        setCopyButtonText("📋 Copy");
                                        setIsCopied(false);
                                    }, 2000);
                                }}
                                title={"Copy configuration to clipboard"}
                            >
                                {copyButtonText}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Docs;
