#!/bin/bash

# Runs the pre-deploy script after the environment is provisioned
# It does the following:
# 1. Copies the config.example file to config.json
# 2. Updates the dataApiHostName, clientId, and tenantId in the config.json file
# 3. Saves the updated config.json file

set -e

echo "Running pre-deploy script..."

# REPOSITORY_ROOT=$(git rev-parse --show-toplevel)
REPOSITORY_ROOT="$(dirname "$(realpath "$0")")/../.."

# Load the azd environment variables
"$REPOSITORY_ROOT/infra/hooks/load_azd_env.sh"

# Update the config.json file
cp $REPOSITORY_ROOT/public/config.example $REPOSITORY_ROOT/public/config.json

# Read the JSON file, modify it, and write it back
jq --arg dataApiHostName "${AZURE_API_CENTER}.data.${AZURE_API_CENTER_LOCATION}.azure-apicenter.ms/workspaces/default" \
   --arg clientId "$AZURE_CLIENT_ID" \
   --arg tenantId "$AZURE_TENANT_ID" \
   '.dataApiHostName = $dataApiHostName | .authentication.clientId = $clientId | .authentication.tenantId = $tenantId' \
   $REPOSITORY_ROOT/public/config.json > tmp.$$.json && mv tmp.$$.json $REPOSITORY_ROOT/public/config.json

# Copy the config.json file to the dist folder
cp $REPOSITORY_ROOT/public/config.json $REPOSITORY_ROOT/dist/config.json
rm $REPOSITORY_ROOT/dist/config.example
