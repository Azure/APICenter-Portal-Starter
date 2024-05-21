# Runs the post-provision script after the environment is provisioned
# It does the following:
# 1. Creates a service principal and assigns the required permissions
# 2. Adds redirect URLs and required permissions to the app
# 3. Assigns the required role to the current user and service principal
# 4. Sets the environment variables

Write-Host "Running post-provision script..."

# $REPOSITORY_ROOT = git rev-parse --show-toplevel
$REPOSITORY_ROOT = "$(Split-Path $MyInvocation.MyCommand.Path)/../.."

# Run only if GITHUB_WORKSPACE is NOT set - this is NOT running in a GitHub Action workflow
if ([string]::IsNullOrEmpty($env:GITHUB_WORKSPACE)) {
    Write-Host "Registering the application in Azure..."

    # Load the azd environment variables
    & "$REPOSITORY_ROOT/infra/hooks/load_azd_env.ps1"

    $USE_EXISTING_API_CENTER = $env:USE_EXISTING_API_CENTER
    $AZURE_ENV_NAME = $env:AZURE_ENV_NAME
    $RESOURCE_GROUP = $USE_EXISTING_API_CENTER ? $env:AZURE_API_CENTER_RESOURCE_GROUP : "rg-$AZURE_ENV_NAME"

    # Create a service principal and assign the required permissions
    $appId = $env:AZURE_CLIENT_ID
    if ([string]::IsNullOrEmpty($appId)) {
        $appId = az ad app list --display-name "spn-$AZURE_ENV_NAME" --query "[].appId" -o tsv
        if ([string]::IsNullOrEmpty($appId)) {
            $appId = az ad app create --display-name spn-$AZURE_ENV_NAME --query "appId" -o tsv
            $spnId = az ad sp create --id $appId --query "id" -o tsv
        }
    }
    $spnId = az ad sp list --display-name "spn-$AZURE_ENV_NAME" --query "[].id" -o tsv
    if ([string]::IsNullOrEmpty($spnId)) {
        $spnId = az ad sp create --id $appId --query "id" -o tsv
    }
    $objectId = az ad app show --id $appId --query "id" -o tsv

    # Add redirect URLs and required permissions to the app
    $spa = @{ redirectUris = @( "http://localhost:5173", "https://localhost:5173", "$env:AZURE_STATIC_APP_URL" ) }
    $requiredResourceAccess = @( @{ resourceAppId = "c3ca1a77-7a87-4dba-b8f8-eea115ae4573"; resourceAccess = @( @{ type = "Scope"; id = "44327351-3395-414e-882e-7aa4a9c3b25d" } ) } )

    $payload = @{ requiredResourceAccess = $requiredResourceAccess; spa = $spa } | ConvertTo-Json -Depth 100 -Compress | ConvertTo-Json

    az rest -m PATCH `
        --uri "https://graph.microsoft.com/v1.0/applications/$objectId" `
        --headers Content-Type=application/json `
        --body $payload

    # Assign the required role to the current user and service principal
    $userId = az ad signed-in-user show --query "id" -o tsv
    $roleDefinitionId = "c7244dfb-f447-457d-b2ba-3999044d1706"
    $resourceId = az resource list --namespace "Microsoft.ApiCenter" --resource-type "services" -g $RESOURCE_GROUP --query "[].id" -o tsv

    $userAssigned = az role assignment create --role $roleDefinitionId --scope $resourceId --assignee $userId
    $spnAssigned = az role assignment create --role $roleDefinitionId --scope $resourceId --assignee $spnId

    # Set the environment variables
    azd env set AZURE_CLIENT_ID $appId
} else {
    Write-Host "Skipping to register the application in Azure..."
}
