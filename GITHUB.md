# Deploying with GitHub Actions

This file provides instructions for deploying the MCP Registry application using GitHub Actions.

## Simplified Setup Process (Recommended)

1. Push this repository to GitHub:

    ```bash
    # Initialize git repository (if not already done)
    git init
    git add .
    git commit -m "Initial commit"

    # Add remote and push (replace with your GitHub username/organization)
    git remote add origin https://github.com/YOUR_USERNAME/MCP-Registry.git
    git push -u origin main
    ```

2. Deploy an Azure Static Web App manually through the Azure Portal.

3. Get the deployment token from your Static Web App:

    - Go to your Static Web App resource in the Azure Portal
    - Click on "Overview" in the left navigation
    - Look for "Manage deployment token" and click it
    - Copy the deployment token

4. Add the token as a GitHub Secret:

    - Go to your GitHub repository
    - Navigate to Settings > Secrets and variables > Actions
    - Click "New repository secret"
    - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
    - Value: Paste the deployment token
    - Click "Add secret"

5. Use the simple workflow file:
    - Ensure `.github/workflows/azure-static-web-app-simple.yml` is in your repository
    - This workflow will automatically build and deploy your app when you push to main

## Advanced Setup (Service Principal-based)

If you need more control or want to automate infrastructure provisioning:

1. Follow steps 1 from above to push your code to GitHub.

2. Create a service principal with the necessary permissions:

    ```bash
    az login
    az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
    az ad sp create-for-rbac --name "mcp-registry-cicd" --role "Contributor" --scopes "/subscriptions/<YOUR_SUBSCRIPTION_ID>"
    ```

3. Add the service principal credentials as GitHub Secrets:

    - `AZURE_CLIENT_ID` - Use the `appId` value
    - `AZURE_TENANT_ID` - Use the `tenant` value
    - `AZURE_SUBSCRIPTION_ID` - Your subscription ID
    - `AZURE_CLIENT_SECRET` - Use the `password` value
    - `AZURE_ENV_NAME` - Set to your desired environment name
    - `AZURE_LOCATION` - Set to your desired Azure region (e.g., "eastus")

4. Use the full workflow file (`.github/workflows/azure-static-web-app.yml`).

## Manual Deployment

You can also trigger a deployment manually:

1. Go to the "Actions" tab in your GitHub repository
2. Select the appropriate workflow
3. Click "Run workflow"
4. Select the branch to deploy from
5. Click "Run workflow"

## Troubleshooting

If the deployment fails:

-   Check the GitHub Actions logs for errors
-   Verify that your secrets are correctly set up
-   Ensure your Static Web App is properly configured

For detailed instructions, see:

-   [CI/CD Setup Guide](./docs/cicd-setup.md)
-   [Static Web App Token Guide](./docs/static-web-app-token.md)
