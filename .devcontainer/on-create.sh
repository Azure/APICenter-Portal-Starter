## Install additional apt packages
sudo apt-get update \
    && sudo apt-get install -y dos2unix libsecret-1-0 xdg-utils \
    && sudo apt-get clean -y && sudo rm -rf /var/lib/apt/lists/*

## Configure git
git config --global pull.rebase false
git config --global core.autocrlf input

## AZURE BICEP CLI ##
az bicep install

## AZURE FUNCTIONS CORE TOOLS ##
npm i -g azure-functions-core-tools@4 --unsafe-perm true

## AZURE STATIC WEB APPS CLI ##
npm install -g @azure/static-web-apps-cli

## OH-MY-POSH ##
sudo wget https://github.com/JanDeDobbeleer/oh-my-posh/releases/latest/download/posh-linux-amd64 -O /usr/local/bin/oh-my-posh
sudo chmod +x /usr/local/bin/oh-my-posh
