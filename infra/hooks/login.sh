#!/bin/bash

# Logs in to Azure through AZD and AZ CLI
# It does the following:
# 1. Checks if the user is logged in to Azure
# 2. Logs in to Azure Developer CLI if the user is not logged in
# 3. Logs in to Azure CLI if the user is not logged in
# 4. Sets the active subscription if the user is logged in
# 5. Prompts the user to select a subscription if the subscription is not set
# 6. Sets the active subscription to the selected subscription
# 7. Exits if the subscription is not found

set -e

# REPOSITORY_ROOT=$(git rev-parse --show-toplevel)
REPOSITORY_ROOT="$(dirname "$(realpath "$0")")/../.."

# Load the azd environment variables
"$REPOSITORY_ROOT/infra/hooks/load_azd_env.sh"

# AZD LOGIN
# Check if the user is logged in to Azure
login_status=$(azd auth login --check-status)

# Check if the user is not logged in
if [[ "$login_status" == *"Not logged in"* ]]; then
  echo "Not logged in, initiating login process..."
  # Command to log in to Azure
  azd auth login
fi

# AZ LOGIN
EXPIRED_TOKEN=$(az ad signed-in-user show --query 'id' -o tsv 2>/dev/null || true)

if [[ -z "$EXPIRED_TOKEN" ]]; then
    az login --scope https://graph.microsoft.com/.default -o none
fi

if [[ -z "${AZURE_SUBSCRIPTION_ID:-}" ]]; then
    ACCOUNT=$(az account show --query '[id,name]')
    echo "You can set the \`AZURE_SUBSCRIPTION_ID\` environment variable with \`azd env set AZURE_SUBSCRIPTION_ID\`."
    echo $ACCOUNT

    read -r -p "Do you want to use the above subscription? (Y/n) " response
    response=${response:-Y}
    case "$response" in
        [yY][eE][sS]|[yY])
            ;;
        *)
            echo "Listing available subscriptions..."
            SUBSCRIPTIONS=$(az account list --query 'sort_by([], &name)' --output json)
            echo "Available subscriptions:"
            echo "$SUBSCRIPTIONS" | jq -r '.[] | [.name, .id] | @tsv' | column -t -s $'\t'
            read -r -p "Enter the name or ID of the subscription you want to use: " subscription_input
            AZURE_SUBSCRIPTION_ID=$(echo "$SUBSCRIPTIONS" | jq -r --arg input "$subscription_input" '.[] | select(.name==$input or .id==$input) | .id')
            if [[ -n "$AZURE_SUBSCRIPTION_ID" ]]; then
                echo "Setting active subscription to: $AZURE_SUBSCRIPTION_ID"
                az account set -s $AZURE_SUBSCRIPTION_ID
            else
                echo "Subscription not found. Please enter a valid subscription name or ID."
                exit 1
            fi
            ;;
        *)
            echo "Use the \`az account set\` command to set the subscription you'd like to use and re-run this script."
            exit 0
            ;;
    esac
else
    az account set -s $AZURE_SUBSCRIPTION_ID
fi
