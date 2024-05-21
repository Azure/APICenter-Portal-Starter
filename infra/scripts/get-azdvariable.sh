#!/bin/bash

# This gets environment variables from the current azd context.

set -e

function usage() {
    cat <<USAGE

    Usage: $0 [-k|--key] [-h|--help]

    Options:
        -k|--key:     Environment variable key

        -h|--help:    Show this message.

USAGE

    exit 1
}

KEY=

if [[ $# -eq 0 ]]; then
    KEY=
fi

while [[ "$1" != "" ]]; do
    case $1 in
        -k | --key)
            shift
            KEY="$1"
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

if [ -z "$KEY" ]; then
    echo -e "\e[36m    Key is required.\e[0m"
    echo ""

    usage
    exit 1
fi

REPOSITORY_ROOT=$(git rev-parse --show-toplevel)

# Load the azd environment variables
. "$REPOSITORY_ROOT/infra/hooks/load_azd_env.sh"

value=${!KEY}

echo $value
