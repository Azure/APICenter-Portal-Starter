# Creating an Azure Static Web App in VS Code

This guide provides step-by-step instructions for creating an Azure Static Web App using Visual Studio Code.

## Prerequisites

-   Visual Studio Code installed
-   Azure account with an active subscription
-   Azure Static Web Apps extension for VS Code

## Steps to Create an Azure Static Web App

### 1. Open the Azure Extension

Click on the Azure icon in the Activity Bar on the left side of VS Code:

![Azure Extension Icon](https://learn.microsoft.com/en-us/azure/static-web-apps/media/vscode-extension/extension-icon.png)

### 2. Navigate to Static Web Apps Section

In the Azure extension sidebar, expand your Azure subscription and look for the "STATIC WEB APPS" section:

![Static Web Apps Section](https://learn.microsoft.com/en-us/azure/static-web-apps/media/vscode-extension/static-web-apps-in-explorer.png)

### 3. Create a New Static Web App

Click on the "+" (plus) icon next to "STATIC WEB APPS" to create a new Static Web App.

### 4. Select Subscription

If prompted, select your Azure subscription from the dropdown list.

### 5. Enter a Name for Your Static Web App

Type a globally unique name for your Static Web App (e.g., "mcp-registry").

### 6. Select Region

Choose a region close to your users, for example:

-   East US
-   West Europe
-   Central US
-   etc.

### 7. Select SKU

Choose between:

-   Free: Basic features, suitable for development and small projects
-   Standard: Additional features like private endpoints, custom authentication, etc.

### 8. Select Resource Group

Either:

-   Select an existing resource group, or
-   Create a new resource group by selecting "+ Create new resource group"

### 9. Configure Build Settings

You'll need to configure the build settings for your application:

-   **Build Preset**: Select "Custom"
-   **App location**: `/` (root of your project)
-   **Api location**: Leave empty (unless you have an API)
-   **Output location**: `dist` (this is where Vite builds your app)

### 10. Confirm and Create

Review your settings and click "Create" to provision your Azure Static Web App.

## After Creation

Once your Static Web App is created, you'll see it appear in the Static Web Apps section of the Azure extension. You'll need to:

1. Get the deployment token for GitHub Actions:

    - Right-click on your Static Web App in VS Code
    - Select "Copy Deployment Token"

2. Add this token to your GitHub repository as a secret:
    - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
    - Value: The copied deployment token

## Troubleshooting

If you encounter any issues:

-   Make sure you're signed in to Azure in VS Code
-   Check that you have the Azure Static Web Apps extension installed
-   Verify that you have sufficient permissions in your Azure subscription
-   Try using the Azure Portal as an alternative method
