# Runs the pre-deploy script after the environment is provisioned
# It does the following:
# 1. Copies the config.example file to config.json
# 2. Updates the dataApiHostName, clientId, and tenantId in the config.json file
# 3. Saves the updated config.json file

Write-Host "Running pre-deploy script..."

# $REPOSITORY_ROOT = git rev-parse --show-toplevel
$REPOSITORY_ROOT = "$(Split-Path $MyInvocation.MyCommand.Path)/../.."

# Load the azd environment variables
& "$REPOSITORY_ROOT/infra/hooks/load_azd_env.ps1"

# Update the config.json file
Copy-Item $REPOSITORY_ROOT/public/config.example -Destination $REPOSITORY_ROOT/public/config.json -Force

$config = Get-Content $REPOSITORY_ROOT/public/config.json | ConvertFrom-Json
$config.dataApiHostName = "$($env:AZURE_API_CENTER).data.$($env:AZURE_API_CENTER_LOCATION).azure-apicenter.ms/workspaces/default"
$config.authentication.clientId = $env:AZURE_CLIENT_ID
$config.authentication.tenantId = $env:AZURE_TENANT_ID

$config | ConvertTo-Json -Depth 100 | Out-File $REPOSITORY_ROOT/public/config.json -Force

# Copy the config.json file to the dist folder
Copy-Item $REPOSITORY_ROOT/public/config.json -Destination $REPOSITORY_ROOT/dist/config.json -Force
Remove-Item $REPOSITORY_ROOT/dist/config.example -Force
