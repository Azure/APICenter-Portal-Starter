# Logs in to Azure through AZD and AZ CLI
# It does the following:
# 1. Checks if the user is logged in to Azure
# 2. Logs in to Azure Developer CLI if the user is not logged in
# 3. Logs in to Azure CLI if the user is not logged in
# 4. Sets the active subscription if the user is logged in
# 5. Prompts the user to select a subscription if the subscription is not set
# 6. Sets the active subscription to the selected subscription
# 7. Exits if the subscription is not found

$REPOSITORY_ROOT = git rev-parse --show-toplevel

# Load the azd environment variables
& "$REPOSITORY_ROOT/infra/hooks/load_azd_env.ps1"

# AZD LOGIN
# Check if the user is logged in to Azure
$login_status = azd auth login --check-status

# Check if the user is not logged in
if ($login_status -like "*Not logged in*") {
    Write-Host "Not logged in, initiating login process..."
    # Command to log in to Azure
    azd auth login
}

# AZ LOGIN
$EXPIRED_TOKEN = az ad signed-in-user show --query 'id' -o tsv 2>$null

if ([string]::IsNullOrEmpty($EXPIRED_TOKEN)) {
    az login --scope https://graph.microsoft.com/.default -o none
}

if ([string]::IsNullOrEmpty($env:AZURE_SUBSCRIPTION_ID)) {
    $ACCOUNT = az account show --query '[id,name]'
    Write-Host "You can set the `AZURE_SUBSCRIPTION_ID` environment variable with `azd env set AZURE_SUBSCRIPTION_ID`."
    Write-Host $ACCOUNT

    $response = Read-Host "Do you want to use the above subscription? (Y/n) "
    $response = if ([string]::IsNullOrEmpty($response)) { "Y" } else { $response }
    switch ($response) {
        { $_ -match "^[yY](es)?$" } {
            # Do nothing
            break
        }
        default {
            Write-Host "Listing available subscriptions..."
            $SUBSCRIPTIONS = az account list --query 'sort_by([], &name)' --output json
            Write-Host "Available subscriptions:"
            Write-Host ($SUBSCRIPTIONS | ConvertFrom-Json | ForEach-Object { "{0} {1}" -f $_.name, $_.id } | Format-Table)
            $subscription_input = Read-Host "Enter the name or ID of the subscription you want to use: "
            $AZURE_SUBSCRIPTION_ID = ($SUBSCRIPTIONS | ConvertFrom-Json | Where-Object { $_.name -eq $subscription_input -or $_.id -eq $subscription_input } | Select-Object -exp id)
            if (-not [string]::IsNullOrEmpty($AZURE_SUBSCRIPTION_ID)) {
                Write-Host "Setting active subscription to: $AZURE_SUBSCRIPTION_ID"
                az account set -s $AZURE_SUBSCRIPTION_ID
            }
            else {
                Write-Host "Subscription not found. Please enter a valid subscription name or ID."
                exit 1
            }
            break
        }
    }
}
else {
    az account set -s $env:AZURE_SUBSCRIPTION_ID
}
