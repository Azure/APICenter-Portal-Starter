# Loads the azd .env file into the current environment
# It does the following:
# 1. Loads the azd .env file from the current environment

Param(
    [switch]
    [Parameter(Mandatory=$false)]
    $ShowMessage
)

if ($ShowMessage) {
    Write-Host "Loading azd .env file from current environment" -ForegroundColor Cyan
}

foreach ($line in (& azd env get-values)) {
    if ($line -match "([^=]+)=(.*)") {
        $key = $matches[1]
        $value = $matches[2] -replace '^"|"$'
        [Environment]::SetEnvironmentVariable($key, $value)
    }
}
