#!/bin/bash

set -e

SHOW_MESSAGE=false

if [[ $# -eq 0 ]]; then
    SHOW_MESSAGE=false
fi

while [[ "$1" != "" ]]; do
    case $1 in
    -m | --show-message)
        SHOW_MESSAGE=true
        ;;

    *)
        usage
        exit 1
        ;;
    esac

    shift
done

if [[ $SHOW_MESSAGE == true ]]; then
    echo -e "\e[36mLoading azd .env file from current environment...\e[0m"
fi

while IFS='=' read -r key value; do
    value=$(echo "$value" | sed 's/^"//' | sed 's/"$//')
    export "$key=$value"
done <<EOF
$(azd env get-values)
EOF
