#!/bin/bash

# Runs the post-provision script after the environment is provisioned
# It does the following:
# 1. Creates a service principal and assigns the required permissions
# 2. Adds redirect URLs and required permissions to the app
# 3. Assigns the required role to the current user and service principal
# 4. Sets the environment variables

set -e

echo "Running post-provision script..."

REPOSITORY_ROOT=$(git rev-parse --show-toplevel)

# Load the azd environment variables
"$REPOSITORY_ROOT/infra/hooks/load_azd_env.sh"

if [ "$USE_EXISTING_API_CENTER" = true ]; then
    RESOURCE_GROUP="$AZURE_API_CENTER_RESOURCE_GROUP"
else
    RESOURCE_GROUP="rg-$AZURE_ENV_NAME"
fi

# Create a service principal and assign the required permissions
appId=$AZURE_CLIENT_ID

if [ -z "$appId" ]
then
    appId=$(az ad app list --display-name "spn-$AZURE_ENV_NAME" --query "[].appId" -o tsv)
    if [ -z "$appId" ]
    then
        appId=$(az ad app create --display-name "spn-$AZURE_ENV_NAME" --query "appId" -o tsv)
        spnId=$(az ad sp create --id $appId --query "id" -o tsv)
    fi
fi
spnId=$(az ad sp list --display-name "spn-$AZURE_ENV_NAME" --query "[].id" -o tsv)
if [ -z "$spnId" ]
then
    spnId=$(az ad sp create --id $appId --query "id" -o tsv)
fi
objectId=$(az ad app show --id $appId --query "id" -o tsv)

# Add redirect URLs and required permissions to the app
spa="{\"redirectUris\": [\"http://localhost:5173\", \"https://localhost:5173\", \"$AZURE_STATIC_APP_URL\"]}"
requiredResourceAccess="[{\"resourceAppId\": \"c3ca1a77-7a87-4dba-b8f8-eea115ae4573\", \"resourceAccess\": [{\"type\": \"Scope\", \"id\": \"44327351-3395-414e-882e-7aa4a9c3b25d\"}]}]"

payload=$(jq -n \
  --argjson spa "$spa" \
  --argjson requiredResourceAccess "$requiredResourceAccess" \
  "{\"spa\": $spa, \"requiredResourceAccess\": $requiredResourceAccess}")

az rest -m PATCH \
    --uri "https://graph.microsoft.com/v1.0/applications/$objectId" \
    --headers Content-Type=application/json \
    --body "$payload"

# Assign the required role to the current user and service principal
userId=$(az ad signed-in-user show --query "id" -o tsv)
roleDefinitionId="c7244dfb-f447-457d-b2ba-3999044d1706"
resourceId=$(az resource list --namespace "Microsoft.ApiCenter" --resource-type "services" -g $RESOURCE_GROUP --query "[].id" -o tsv)

userAssigned=$(az role assignment create --role $roleDefinitionId --scope $resourceId --assignee $userId)
spnAssigned=$(az role assignment create --role $roleDefinitionId --scope $resourceId --assignee $spnId)

# Set the environment variables
azd env set AZURE_CLIENT_ID $appId
