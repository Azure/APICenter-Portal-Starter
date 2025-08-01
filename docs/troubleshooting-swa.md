# Troubleshooting Azure Static Web Apps Deployment

## Common Issues and Solutions

### 1. Deployment Token Issue

If you're seeing authentication errors or the deployment is not starting, your deployment token might be incorrect or expired.

#### Steps to refresh your deployment token:

1. Go to the Azure Portal
2. Navigate to your Static Web App resource
3. In the left navigation, click on "Manage deployment token"
4. Copy the new token
5. Go to your GitHub repository Settings > Secrets and variables > Actions
6. Edit the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret with the new token

### 2. No website appearing after successful deployment

If the deployment workflow completes successfully but you don't see your website:

1. Check the URL: Make sure you're using the correct URL from the Azure portal
2. Clear browser cache: Try accessing the site in an incognito/private window
3. Check for routing issues: Try directly accessing a specific file like `/test.html`
4. Check for CORS issues: If your app makes API calls, there might be CORS issues

### 3. Resource Configuration

Make sure your Azure Static Web App resource is:

1. Created in a supported region
2. Using the appropriate SKU (Free or Standard)
3. Linked to the correct GitHub repository

### 4. Deployment Logs

Check the detailed deployment logs in:

1. GitHub Actions workflow logs
2. Azure Portal > Your Static Web App > Deployment History

### 5. Testing Steps

After these changes, try:

1. Visit your Azure Static Web App URL directly
2. Try accessing `https://your-swa-url/test.html` to see if the test page loads
3. Check browser console for any errors

### 6. Recreating the Resource

If all else fails, consider:

1. Creating a new Azure Static Web App resource
2. Getting a fresh deployment token
3. Updating your GitHub secret
4. Triggering a new deployment

### 7. Verifying the Azure Resource Existence

To check if your Azure Static Web App resource exists and is properly configured:

1. Go to the Azure Portal (https://portal.azure.com)
2. Search for "Static Web Apps" in the search bar
3. Verify that your app appears in the list
