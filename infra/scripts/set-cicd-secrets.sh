#!/bin/bash
# set-cicd-secrets.sh
# This script helps set up the GitHub secrets required for the CI/CD pipeline

# Default values
SERVICE_PRINCIPAL_NAME="mcp-registry-cicd"
AZURE_ENV_NAME="mcp-registry"
AZURE_LOCATION="eastus"

# Display help
function show_help {
    echo "Usage: $0 -r REPO_NAME -o ORG_NAME [-s SUBSCRIPTION_ID] [-p SERVICE_PRINCIPAL_NAME] [-e ENV_NAME] [-l LOCATION]"
    echo ""
    echo "Options:"
    echo "  -r REPO_NAME               GitHub repository name"
    echo "  -o ORG_NAME                GitHub organization or username"
    echo "  -s SUBSCRIPTION_ID         Azure subscription ID (optional, uses current if not provided)"
    echo "  -p SERVICE_PRINCIPAL_NAME  Name for the Azure service principal (default: $SERVICE_PRINCIPAL_NAME)"
    echo "  -e ENV_NAME                Azure environment name (default: $AZURE_ENV_NAME)"
    echo "  -l LOCATION                Azure location (default: $AZURE_LOCATION)"
    echo "  -h                         Show this help message"
    exit 1
}

# Parse command line arguments
while getopts "r:o:s:p:e:l:h" opt; do
    case $opt in
        r) GITHUB_REPO_NAME="$OPTARG" ;;
        o) GITHUB_ORG_NAME="$OPTARG" ;;
        s) SUBSCRIPTION_ID="$OPTARG" ;;
        p) SERVICE_PRINCIPAL_NAME="$OPTARG" ;;
        e) AZURE_ENV_NAME="$OPTARG" ;;
        l) AZURE_LOCATION="$OPTARG" ;;
        h) show_help ;;
        *) show_help ;;
    esac
done

# Check required parameters
if [ -z "$GITHUB_REPO_NAME" ] || [ -z "$GITHUB_ORG_NAME" ]; then
    echo "Error: GitHub repository name and organization name are required."
    show_help
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI is not installed. Please install it from https://cli.github.com/"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status 2>&1 | grep -q "Logged in"; then
    echo "You need to log in to GitHub first. Run 'gh auth login'"
    exit 1
fi

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it from https://aka.ms/installazurecli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "You need to log in to Azure first. Run 'az login'"
    exit 1
fi

# If no subscription ID is provided, get the current subscription
if [ -z "$SUBSCRIPTION_ID" ]; then
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    echo "Using current Azure subscription: $SUBSCRIPTION_ID"
fi

# Set the subscription
az account set --subscription "$SUBSCRIPTION_ID"

# Create service principal
echo "Creating service principal '$SERVICE_PRINCIPAL_NAME'..."
SP_OUTPUT=$(az ad sp create-for-rbac --name "$SERVICE_PRINCIPAL_NAME" --role "Contributor" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID" -o json)

# Extract values
CLIENT_ID=$(echo "$SP_OUTPUT" | jq -r '.appId')
CLIENT_SECRET=$(echo "$SP_OUTPUT" | jq -r '.password')
TENANT_ID=$(echo "$SP_OUTPUT" | jq -r '.tenant')

# Set GitHub secrets
echo "Setting GitHub secrets..."

# Set secret function
function set_github_secret {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    
    # Use the GitHub CLI to set the secret
    echo "Setting $SECRET_NAME secret..."
    echo "$SECRET_VALUE" | gh secret set "$SECRET_NAME" -R "$GITHUB_ORG_NAME/$GITHUB_REPO_NAME"
}

# Set the secrets
set_github_secret "AZURE_CLIENT_ID" "$CLIENT_ID"
set_github_secret "AZURE_TENANT_ID" "$TENANT_ID"
set_github_secret "AZURE_SUBSCRIPTION_ID" "$SUBSCRIPTION_ID"
set_github_secret "AZURE_ENV_NAME" "$AZURE_ENV_NAME"
set_github_secret "AZURE_LOCATION" "$AZURE_LOCATION"

# Output summary
echo ""
echo "Secrets successfully set in your GitHub repository!"
echo "Repository: $GITHUB_ORG_NAME/$GITHUB_REPO_NAME"
echo "Service Principal: $SERVICE_PRINCIPAL_NAME"
echo "Azure Environment: $AZURE_ENV_NAME"
echo "Azure Location: $AZURE_LOCATION"
echo ""
echo "You're all set for CI/CD! Push to the main branch to trigger a deployment."
