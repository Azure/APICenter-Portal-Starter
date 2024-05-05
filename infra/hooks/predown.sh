#!/bin/bash

# Runs the pre-down script before the environment is provisioned
# It does the following:
# 1. Loads the azd environment variables
# 2. Logs in to the Azure CLI if not running in a GitHub Action

set -e

echo "Running pre-down script..."

REPOSITORY_ROOT=$(git rev-parse --show-toplevel)

# Load the azd environment variables
"$REPOSITORY_ROOT/infra/hooks/load_azd_env.sh"

if [ -z "$GITHUB_WORKSPACE" ]; then
    # The GITHUB_WORKSPACE is not set, meaning this is not running in a GitHub Action
    "$REPOSITORY_ROOT/infra/hooks/login.sh"
fi
