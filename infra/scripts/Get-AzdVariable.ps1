# This gets environment variables from the current azd context.
Param(
    [string]
    [Parameter(Mandatory=$false)]
    $Key = "",

    [switch]
    [Parameter(Mandatory=$false)]
    $Help
)

function Show-Usage {
    Write-Output "    This gets environment variables from the current azd context

    Usage: $(Split-Path $MyInvocation.ScriptName -Leaf) ``
            [-Key    <Environment variable key>] ``

            [-Help]

    Options:
        -Key:     Environment variable key. Example: ``AZURE_ENV_NAME``

        -Help:    Show this message.
"

    Exit 0
}

# Show usage
$needHelp = $Help -eq $true
if ($needHelp -eq $true) {
    Show-Usage
    Exit 0
}

if ($Key -eq "") {
    Write-Host "    Key is required." -ForegroundColor Red
    Write-Host ""

    Show-Usage
    Exit 0
}

$REPOSITORY_ROOT = git rev-parse --show-toplevel

pwsh -Command {
    Param(
        $RepositoryRoot,
        $Key
    )

    # Load the azd environment variables
    & "$RepositoryRoot/infra/hooks/load_azd_env.ps1"

    $envs = Get-ChildItem -Path env:

    $value = $($envs | Where-Object { $_.Name -eq $Key }).Value

    Write-Output $value
} -args $REPOSITORY_ROOT, $Key
