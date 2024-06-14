---
page_type: sample
languages:
- azdeveloper
- typescript
- powershell
- bash
- html
- bicep
products:
- azure
- azure-api-center
- static-web-apps
urlFragment: APICenter-Portal-Starter
name: Self-host Your Azure API Center Portal
description: Reference implementation of API Center portal for a web-based API discovery and consumption experience
---
<!-- YAML front-matter schema: https://review.learn.microsoft.com/en-us/help/contribute/samples/process/onboarding?branch=main#supported-metadata-fields-for-readmemd -->

[![Open Source Love](https://firstcontributions.github.io/open-source-badges/badges/open-source-v1/open-source.svg)](https://github.com/firstcontributions/open-source-badges)

# Self-host Your Azure API Center Portal

## Overview

- [What is Azure API Center?](./#what-is-the-azure-api-center-portal)
- [What is the Azure API Center Portal?](./#azure-api-center-portal)
- [Prerequisites](./#prerequisites)
- [Quick Start](./#quick-start)
  - [Automated deployment using `azd`](./#automated-deployment-using-azd)
  - [Running the portal locally](./#running-the-portal-locally)
  - [Manual deployment to Azure Static Web Apps](./#manual-deployment-to-azure-static-web-apps)
- [Contributing](./#contributing)
- [Bugs & Issues & Feedback](./#bugs--issues--feedback)
- [Code of Conduct](./#code-of-conduct)
- [Trademark Notice](./#trademark-notice)
- [Telemetry](./#telemetry)
- [License](./#license)

## What is the Azure API Center portal?

[Azure API Center](https://learn.microsoft.com/azure/api-center/overview) is a service that helps you develop and maintain a structured inventory of your organization’s APIs. With API Center, you can track all of your APIs in a centralized location, regardless of their type, lifecycle stage, or deployment location. API Center enables API discovery, reuse, and governance empowering API Platform Teams.

## Azure API Center Portal

**API Center portal** is a website that empowers developers and stakeholders to seamlessly discover and engage with APIs. Our reference implementation of the API Center portal enables API platform teams to provide a web-based API discovery and consumption experience to API consumers. 

The API Center portal reference implementation provides:

- A framework for publishing and maintaining a customer-managed API portal.
- A portal platform that customers can modify or extend to meet their needs.
- Flexibility to host on different infrastructures, including deployment to Azure Static Web Apps or Azure App Service.

## Prerequisites

Before you begin, ensure you have met the following requirements:

1. :white_check_mark: You have installed the latest version of [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
1. :white_check_mark: [Vite package](https://www.npmjs.com/package/vite).

## Quick Start

You have two options to deploy this self-hosted API Center Portal:

- **Automated deployment** &ndash; Use the Azure developer CLI (`azd`) for one-step deployment of the portal app. This option is recommended for a streamlined deployment process.
- **Manual deployment** &ndash; Follow step-by-step guidance to deploy the Azure Functions app and configure the event subscription. This option is recommended if you prefer to deploy and manage the resources manually.

### Automated deployment using `azd`

> **NOTE**: You will need the additional prerequisites for this option
> 
> - :white_check_mark: Azure Developer CLI (`azd`)
> - :white_check_mark: Azure CLI
> - :white_check_mark: GitHub CLI

1. Fork this repository to your GitHub account and clone it.

    ```bash
    git clone https://github.com/<YOUR_GITHUB_ALIAS>/APICenter-Portal-Starter.git
    ```

1. Log in with the following command. Then, you will be able to use the `azd` cli to quickly provision and deploy the application.

    ```bash
    # Authenticate with Azure Developer CLI
    azd auth login
    
    # Authenticate with Azure CLI
    az login
    ```

1. Run `azd up` to provision all the resources to Azure and deploy the code to those resources.

    ```bash
    azd up
    ```

   Enter an environment name and select your desired `subscription` and `location`. Then, you will be asked to enter a few more values:

   1. Choose whether to use an existing API Center instance or not (`apiCenterExisted`).
   1. Pass the values for `apiCenterName`, `apiCenterRegion` and `apiCenterResourceGroupName`, if you choose to use the existing API center resource (`apiCenterExisted` value to `true`).
   1. Leave them blank, if you choose to create a new API center resource (`apiCenterExisted` value to `false`).
   1. Pass `staticAppLocation` value for the Azure Static Web Apps instance. Wait a moment for the resource deployment to complete.

   > There are two scenarios:
   > 
   > 1. Portal with new API Center &ndash; You need to give `False` to `apiCenterExisted` and leave `apiCenterName`, `apiCenterRegion` and `apiCenterResourceGroupName` blank.
   > 1. Portal with existing API Center &ndash; You need to give `True` to `apiCenterExisted` and pass values to `apiCenterName`, `apiCenterRegion` and `apiCenterResourceGroupName`.

1. If you want to integrate the CI/CD pipeline with GitHub Actions, you can use the following command to create a GitHub repository and push the code to the repository. First of all, log in to GitHub.

    ```bash
    # Authenticate with GitHub CLI
    gh auth login
    ```

1. Run the following commands to update your GitHub repository variables.

   > **NOTE**: Make sure that you've forked this repository to your GitHub account before running the following commands.

    ```bash
    # Bash
    AZURE_CLIENT_ID=$(./infra/scripts/get-azdvariable.sh --key AZURE_CLIENT_ID)
    azd pipeline config --principal-id $AZURE_CLIENT_ID
    
    # PowerShell
    $AZURE_CLIENT_ID = $(./infra/scripts/Get-AzdVariable.ps1 -Key AZURE_CLIENT_ID)
    azd pipeline config --principal-id $AZURE_CLIENT_ID
    ```

1. Now, you're good to go! Push the code to the GitHub repository or manually run the GitHub Actions workflow to get your portal deployed.

### Running the portal locally

> **NOTE**: You will need the additional prerequisites for this option
> 
> - :white_check_mark: [Configured app registration in your Microsoft Entra ID tenant](https://learn.microsoft.com/azure/api-center/enable-api-center-portal#create-microsoft-entra-app-registration) with the right API permission scope and Redirect URI.
> - :white_check_mark: Portal sign-in enabled with the [right role assignment](https://learn.microsoft.com/azure/api-center/enable-api-center-portal#enable-sign-in-to-portal-by-microsoft-entra-users-and-groups)

Follow these steps to get your development environment set up:

1. Clone the repository

    ```bash
    git clone https://github.com/Azure/APICenter-Portal-Starter.git
    ```

1. Switch to main branch:

    ```bash
    git checkout main
    ```

1. Copy or rename the `public/config.example` file to the `public/config.json`.
1. Configure the `public/config.json` file to point to your Azure API Center service. Here’s an example configuration:

    ```JSON
    {
      "dataApiHostName": "<service name>.data.<region>.azure-apicenter.ms/workspaces/default",
      "title": "API portal",
      "authentication": {
          "clientId": "<client ID>",
          "tenantId": "<tenant ID>",
          "scopes": ["https://azure-apicenter.net/user_impersonation"],
          "authority": "https://login.microsoftonline.com/"
      }
    }
    ```

1. Install the required packages.

    ```bash
    npm install
    ```

1. Start the development server - This command will start the portal in development mode running locally:

   ```bash
   npm start
   ```

### Manual deployment to Azure Static Web Apps

[Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview) is a service that automatically builds and deploys full stack web apps to Azure from a code repository. This tutorial uses GitHub Actions to deploy to Azure Static Web Apps.

1. Create a new **Static Web App**.
1. Select **GitHub** as the **Source**.
1. Select the **GitHub organization, repository, and branch** containing the API Center portal. Note: You must fork the API Center portal repository to your own personal account or organization and select this repository.
1. Select **React** as the **Build Presets**.
1. Enter **/** as the **App location**.
1. Enter **dist** as the **Output location**.
1. Click **Create**. A GitHub workflow file will be committed to the repository selected in Step #3, and deployment to your Static Web App with GitHub Actions will begin. It may take up to five minutes to see your changes published.

To view your API Center portal running on Static Web Apps, click **View app in browser** from the **Overview** tab in the Static Web App resource you created in Azure portal.

## Contributing

:rocket: See [the contribution guidelines](CONTRIBUTING.md) for ideas and guidance on how to improve the template. Thank you! :rocket:


## Bugs & Issues & Feedback

:sunny: We Love Hearing From You! :sunny:


Your feedback is invaluable to us, and we encourage you to share your thoughts and suggestions in the repository's **Issues** section. You can also report bugs or submit feature requests there. Rest assured, we’ll be keeping a close eye on your input to continuously improve. While we’re dedicated to monitoring these issues, please note that this channel is not part of our Microsoft Azure Service Support.
 
**Microsoft Azure Support** assistance is limited to the initial setup of the Azure Function app that runs the linting engine. Best effort support is provided for problems that are caused by environmental factors, such as (but not limited to): hosting platform, development environment, network configuration. 
 
If you need technical assistance with extending the linting engine or improving existing rules , please leverage existing technical communities such as Stack Overflow. We don't provide support through GitHub Issues.
 
We welcome and appreciate community contributions.

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademark Notice

Trademarks This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow Microsoft’s Trademark & Brand Guidelines. Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## Telemetry

Data Collection. The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

## License

[MIT](LICENSE.txt)
