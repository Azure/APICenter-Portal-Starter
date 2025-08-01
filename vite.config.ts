/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), basicSsl()],
    define: {
        "process.env": {},
    },
    build: {
        // Optimize bundle size
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        // Ensure static assets are copied to build output
        copyPublicDir: true,
        // Split chunks for better caching and smaller sizes
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor code from app code
                    vendor: ["react", "react-dom", "react-router-dom", "@fluentui/react-components"],
                    // Split markdown processing libraries
                    markdown: ["react-markdown", "rehype-raw", "rehype-truncate", "remark-gfm"],
                    // Split API-related dependencies
                    api: ["@asyncapi/react-component", "swagger-ui-react"],
                },
            },
        },
    },
});
