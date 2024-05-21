# This sets environment variables to GitHub repository.
Param(
    [string]
    [Parameter(Mandatory=$false)]
    $Repo = "",

    [switch]
    [Parameter(Mandatory=$false)]
    $Help
)

function Show-Usage {
    Write-Output "    This sets environment variables to GitHub repository

    Usage: $(Split-Path $MyInvocation.ScriptName -Leaf) ``
            [-Repo    <GitHub repository>] ``

            [-Help]

    Options:
        -Repo:    GitHub repository formatted as ``owner/repo``. Example: ``Azure/APICenter-Portal-Starter``

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

if ($Repo -eq "") {
    $segments = $(git config --get remote.origin.url).Split("/", [System.StringSplitOptions]::RemoveEmptyEntries)
    $Repo = $([string]::Join("/", $segments[2], $segments[3])).Replace(".git", "")
}

$REPOSITORY_ROOT = git rev-parse --show-toplevel

pwsh -Command {
    Param(
        $REPOSITORY_ROOT,
        $Repo
    )

    # Load the azd environment variables
    & "$REPOSITORY_ROOT/infra/hooks/load_azd_env.ps1" -ShowMessage

    gh variable set -f $REPOSITORY_ROOT/.azure/$env:AZURE_ENV_NAME/.env -R $Repo
} -args $REPOSITORY_ROOT, $Repo
