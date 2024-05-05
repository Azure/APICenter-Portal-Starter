#!/bin/bash

# This sets environment variables to GitHub repository.

set -e

function usage() {
    cat <<USAGE

    Usage: $0 [-R|--repo] [-h|--help]

    Options:
        -R|--repo:    GitHub repository.

        -h|--help:    Show this message.

USAGE

    exit 1
}

REPOSITORY=

if [[ $# -eq 0 ]]; then
    REPOSITORY=
fi

while [[ "$1" != "" ]]; do
    case $1 in
        -R | --repo)
            shift
            REPOSITORY="$1"
        ;;

        -h | --help)
            usage
            exit 1
        ;;

        *)
            usage
            exit 1
        ;;
    esac

    shift
done

if [ -z "$REPOSITORY" ]; then
    segments=( $(git config --get remote.origin.url | tr '/' ' ') )
    REPOSITORY="${segments[2]}/${segments[3]%.git}"
fi

REPOSITORY_ROOT=$(git rev-parse --show-toplevel)

# Load the azd environment variables
. "$REPOSITORY_ROOT/infra/hooks/load_azd_env.sh" --show-message

gh variable set -f $REPOSITORY_ROOT/.azure/$AZURE_ENV_NAME/.env -R $REPOSITORY
