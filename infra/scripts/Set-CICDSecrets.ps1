# Set-CICDSecrets.ps1
# This script helps set up the GitHub secrets required for the CI/CD pipeline

# Parameters
param (
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepoName,
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubOrgName,
    
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ServicePrincipalName = "mcp-registry-cicd",
    
    [Parameter(Mandatory=$false)]
    [string]$AzureEnvName = "mcp-registry",
    
    [Parameter(Mandatory=$false)]
    [string]$AzureLocation = "eastus"
)

# Check if the GitHub CLI is installed
$ghInstalled = $null -ne (Get-Command gh -ErrorAction SilentlyContinue)
if (-not $ghInstalled) {
    Write-Host "GitHub CLI is not installed. Please install it from https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# Check if logged in to GitHub
$ghLoggedIn = $null -ne (gh auth status 2>&1 | Select-String "Logged in")
if (-not $ghLoggedIn) {
    Write-Host "You need to log in to GitHub first. Run 'gh auth login'" -ForegroundColor Yellow
    exit 1
}

# Check if az CLI is installed
$azInstalled = $null -ne (Get-Command az -ErrorAction SilentlyContinue)
if (-not $azInstalled) {
    Write-Host "Azure CLI is not installed. Please install it from https://aka.ms/installazurecli" -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
$azLoggedIn = $null -ne (az account show 2>$null)
if (-not $azLoggedIn) {
    Write-Host "You need to log in to Azure first. Run 'az login'" -ForegroundColor Yellow
    exit 1
}

# If no subscription ID is provided, get the current subscription
if ([string]::IsNullOrEmpty($SubscriptionId)) {
    $SubscriptionId = (az account show --query id -o tsv)
    Write-Host "Using current Azure subscription: $SubscriptionId" -ForegroundColor Cyan
}

# Set the subscription
az account set --subscription $SubscriptionId

# Create service principal
Write-Host "Creating service principal '$ServicePrincipalName'..." -ForegroundColor Cyan
$spOutput = az ad sp create-for-rbac --name $ServicePrincipalName --role "Contributor" --scopes "/subscriptions/$SubscriptionId" | ConvertFrom-Json

# Extract values
$clientId = $spOutput.appId
$clientSecret = $spOutput.password
$tenantId = $spOutput.tenant

# Set GitHub secrets
Write-Host "Setting GitHub secrets..." -ForegroundColor Cyan

# Set secret function
function Set-GitHubSecret {
    param (
        [string]$SecretName,
        [string]$SecretValue
    )
    
    # Use the GitHub CLI to set the secret
    Write-Host "Setting $SecretName secret..." -ForegroundColor Green
    echo $SecretValue | gh secret set $SecretName -R "$GitHubOrgName/$GitHubRepoName"
}

# Set the secrets
Set-GitHubSecret -SecretName "AZURE_CLIENT_ID" -SecretValue $clientId
Set-GitHubSecret -SecretName "AZURE_TENANT_ID" -SecretValue $tenantId
Set-GitHubSecret -SecretName "AZURE_SUBSCRIPTION_ID" -SecretValue $SubscriptionId
Set-GitHubSecret -SecretName "AZURE_ENV_NAME" -SecretValue $AzureEnvName
Set-GitHubSecret -SecretName "AZURE_LOCATION" -SecretValue $AzureLocation

# Output summary
Write-Host "`nSecrets successfully set in your GitHub repository!" -ForegroundColor Green
Write-Host "Repository: $GitHubOrgName/$GitHubRepoName" -ForegroundColor Cyan
Write-Host "Service Principal: $ServicePrincipalName" -ForegroundColor Cyan
Write-Host "Azure Environment: $AzureEnvName" -ForegroundColor Cyan
Write-Host "Azure Location: $AzureLocation" -ForegroundColor Cyan
Write-Host "`nYou're all set for CI/CD! Push to the main branch to trigger a deployment." -ForegroundColor Green
