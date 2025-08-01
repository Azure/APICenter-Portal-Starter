# Creating an Azure Static Web App using Azure CLI

This guide provides step-by-step instructions for creating an Azure Static Web App using the Azure CLI from VS Code's terminal.

## Prerequisites

-   Azure CLI installed
-   Azure account with an active subscription
-   Logged in to Azure via the CLI (`az login`)

## Steps to Create an Azure Static Web App using Azure CLI

### 1. Ensure you're logged in to Azure

```powershell
az login
```

### 2. List your subscriptions and select the one you want to use

```powershell
# List subscriptions
az account list --output table

# Set your subscription (if needed)
az account set --subscription "Your-Subscription-Name-or-ID"
```

### 3. Create a Resource Group (if you don't already have one)

```powershell
az group create --name "rg-mcp-registry" --location "eastus"
```

Replace "eastus" with your preferred Azure region.

### 4. Create the Azure Static Web App

```powershell
az staticwebapp create \
    --name "mcp-registry" \
    --resource-group "rg-mcp-registry" \
    --location "eastus" \
    --sku "Free" \
    --source "https://github.com/YOUR_USERNAME/MCP-Registry" \
    --branch "main" \
    --app-location "/" \
    --output-location "dist"
```

Customize the parameters as needed:

-   `--name`: A globally unique name for your Static Web App
-   `--resource-group`: Your resource group name
-   `--location`: Azure region (e.g., "eastus", "westeurope")
-   `--sku`: "Free" or "Standard"
-   `--source`: GitHub repository URL (optional, can be configured later)
-   `--branch`: Branch to deploy (optional, can be configured later)
-   `--app-location`: Root directory of your app
-   `--output-location`: Build output directory (for Vite projects, this is typically "dist")

### 5. Get the deployment token

```powershell
az staticwebapp secrets list \
    --name "mcp-registry" \
    --resource-group "rg-mcp-registry" \
    --query "properties.apiKey" -o tsv
```

This command will output the deployment token you need for GitHub Actions.

### 6. Add the token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: The deployment token from step 5
6. Click "Add secret"

## Clean Up Resources When No Longer Needed

```powershell
# Delete the Static Web App
az staticwebapp delete --name "mcp-registry" --resource-group "rg-mcp-registry"

# Delete the Resource Group
az group delete --name "rg-mcp-registry"
```

## Troubleshooting

If you encounter any issues:

-   Make sure you're logged in to Azure (`az login`)
-   Check that you have the correct permissions on your Azure subscription
-   Verify resource name uniqueness (Static Web App names must be globally unique)
-   Check for typos in resource group names or other parameters
