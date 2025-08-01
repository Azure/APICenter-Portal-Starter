# Azure Static Web App Size Limit Issues

This document provides information about the app content size limit error encountered during deployment to Azure Static Web Apps.

## Problem

When deploying to Azure Static Web Apps, you may encounter the following error:

```
The size of the app content was too large. The limit for this Static Web App is 262144000 bytes. For a higher app size limit, consider upgrading to the Standard plan.
```

This error occurs because the free tier of Azure Static Web Apps has a limit of 250MB (262,144,000 bytes) for the total size of your application content.

## Solutions

There are two main approaches to resolving this issue:

### 1. Optimize Application Size

We've already implemented several optimizations in the Vite configuration:

-   Added code splitting to create smaller, more cacheable chunks
-   Configured Terser minification with console and debugger removal
-   Set up chunk splitting for vendor libraries

Additional optimization options:

-   Remove unused dependencies from `package.json`
-   Use image compression for any large media files
-   Consider using a CDN for large assets
-   Remove any development or test files from the production build

### 2. Upgrade to Standard Plan

If your application genuinely requires more than 250MB, consider upgrading to the Standard plan of Azure Static Web Apps, which has a higher content size limit (750MB) and other benefits:

| Feature                     | Free  | Standard  |
| --------------------------- | ----- | --------- |
| App content size            | 250MB | 750MB     |
| Custom domains              | 2     | 5         |
| Staging environments        | 1     | 3         |
| Pre-production environments | 0     | 3         |
| Authentication providers    | 5     | Unlimited |

To upgrade to the Standard plan:

1. Go to the Azure portal and navigate to your Static Web App
2. Select the "Upgrade" option from the sidebar
3. Follow the prompts to upgrade to the Standard plan

## Next Steps

1. Check your application size by running a local build: `yarn build`
2. Review the contents of the `dist` folder to identify any unusually large files
3. Implement the optimization strategies mentioned above
4. If optimizations are insufficient, consider upgrading to the Standard plan
