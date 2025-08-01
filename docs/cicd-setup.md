# GitHub Actions CI/CD Setup Guide

This document provides instructions for setting up the CI/CD pipeline for deploying this project to Azure Static Web Apps using GitHub Actions.

## Prerequisites

1. An Azure subscription
2. A GitHub repository (this repository)
3. Azure Static Web App already created in your Azure subscription

## Creating an Azure Static Web App

Before setting up CI/CD, you need to create an Azure Static Web App. You can do this in several ways:

-   [Using VS Code](./create-static-web-app-vscode.md) (Recommended)
-   [Using Azure CLI from VS Code Terminal](./create-static-web-app-cli.md)
-   Using the Azure Portal

## Simplified Setup (Recommended)

This approach uses the built-in Azure Static Web Apps GitHub Action and requires minimal setup:

1. Create your Azure Static Web App using one of the methods above
2. Get the deployment token for your GitHub Actions:

    - If using VS Code: Right-click on your Static Web App in the Azure extension and select "Copy Deployment Token"
    - If using CLI: Run `az staticwebapp secrets list --name "your-app-name" --resource-group "your-resource-group" --query "properties.apiKey" -o tsv`
    - If using Azure Portal: Go to your Static Web App > Overview > Manage deployment token

    For detailed instructions, see the [Static Web App Token Guide](./static-web-app-token.md).

3. Add the token as a GitHub Secret:

    - Go to your GitHub repository
    - Navigate to Settings > Secrets and variables > Actions
    - Click "New repository secret"
    - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
    - Value: The deployment token you copied from Azure Portal
    - Click "Add secret"

4. Use the `azure-static-web-app-simple.yml` workflow file which will:
    - Build your application
    - Deploy it to Azure Static Web Apps
    - Handle PR preview environments automatically

## Advanced Setup (Service Principal-based)

If you need more control or want to automate infrastructure provisioning as well:

1. Create a service principal with the necessary permissions:

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"

# Create a service principal with Contributor role at subscription scope
az ad sp create-for-rbac --name "mcp-registry-cicd" --role "Contributor" --scopes "/subscriptions/<YOUR_SUBSCRIPTION_ID>" --sdk-auth
```

2. The command will output JSON with the credentials. Add these values as GitHub Secrets:

    - `AZURE_CLIENT_ID` - Use the `clientId` value
    - `AZURE_TENANT_ID` - Use the `tenantId` value
    - `AZURE_SUBSCRIPTION_ID` - Use the `subscriptionId` value
    - `AZURE_CLIENT_SECRET` - Use the `clientSecret` value
    - `AZURE_ENV_NAME` - Set to your desired environment name
    - `AZURE_LOCATION` - Set to your desired Azure region (e.g., "eastus")

3. Use the `azure-static-web-app.yml` workflow file which will:
    - Build your application
    - Provision infrastructure using Bicep templates via AZD
    - Deploy the application
    - Handle PR environments and cleanup

## Troubleshooting

If you encounter any issues with the deployment:

1. Check the workflow run logs in the GitHub Actions tab
2. Verify that all required secrets are correctly set up
3. Ensure your Azure resources have the necessary permissions
