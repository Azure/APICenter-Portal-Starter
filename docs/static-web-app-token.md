# Getting Your Azure Static Web App Deployment Token

This guide walks you through the process of retrieving your Azure Static Web App deployment token, which is required for the GitHub Actions CI/CD pipeline.

## Method 1: Using VS Code (Recommended)

If you've created your Static Web App using VS Code:

1. Open VS Code and click on the Azure icon in the Activity Bar
2. Expand your subscription and find the "STATIC WEB APPS" section
3. Right-click on your Static Web App
4. Select "Copy Deployment Token"
5. The token is now on your clipboard

## Method 2: Using Azure CLI

If you prefer using the command line:

```powershell
az staticwebapp secrets list \
  --name "your-app-name" \
  --resource-group "your-resource-group" \
  --query "properties.apiKey" -o tsv
```

Replace "your-app-name" and "your-resource-group" with your actual values.

## Method 3: Using Azure Portal

If you created your Static Web App through the Azure Portal:

## Method 3: Using Azure Portal

If you created your Static Web App through the Azure Portal:

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to your Static Web App resource
3. In the left navigation menu, click on "Overview"
4. Look for the "Manage deployment token" button or link
5. Click it to reveal your deployment token
6. Copy this token (it's a long string)

## Adding the Token to GitHub Secrets

Regardless of which method you used to get the token:

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left navigation, click on "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. For the name, enter: `AZURE_STATIC_WEB_APPS_API_TOKEN`
6. For the value, paste the deployment token you copied
7. Click "Add secret"

## Next Steps

Once the secret is added to your GitHub repository:

1. Ensure the workflow file (`.github/workflows/azure-static-web-app-simple.yml`) is in your repository
2. Push a change to your main branch to trigger the workflow

## Notes

-   The deployment token is sensitive information. Do not share it or commit it to your repository.
-   If you need to rotate the token, you can generate a new one in the Azure Portal and update your GitHub secret.
-   This token allows GitHub Actions to deploy to your Static Web App without needing a service principal.

## Troubleshooting

-   If your deployment fails, check the GitHub Actions logs for detailed error messages.
-   Verify that your workflow file is correctly configured for your project structure.
-   Make sure your Static Web App is correctly configured to build from your project's source code.
