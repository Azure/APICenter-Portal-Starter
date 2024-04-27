[![Open Source Love](https://firstcontributions.github.io/open-source-badges/badges/open-source-v1/open-source.svg)](https://github.com/firstcontributions/open-source-badges)


# Self-host Your Azure API Center Portal

## Overview

- [What is Azure API Center?](./#-what-is-azure-api-center)
- [What is the Azure API Center Portal?](./#-what-is-azure-api-center)
- [Prerequisites](./#-what-is-azure-api-center)
- [Quick Start]()
- [Contributing]()
- [Bugs & Issues & Feedback]()
- [Code of Conduct]()
- [Trademark Notice]()
- [Telemetry]()
- [License]()

## What is the Azure API Center Portal?

[Azure API Center](https://learn.microsoft.com/azure/api-center/overview) is a service that helps you develop and maintain a structured inventory of your organization’s APIs. With API Center, you can track all of your APIs in a centralized location, regardless of their type, lifecycle stage, or deployment location. API Center enables API discovery, reuse, and governance empowering API Platform Teams.

## Azure API Center Portal

**API Center Portal** is a website that empowers developers and stakeholders to seamlessly discover and engage with APIs. Our reference implementation of the API Center portal enables API platform teams to provide a web-based API discovery and consumption experience to API consumers. 

The API Center portal reference implementation provides:
- A framework for publishing and maintaining a customer-managed API portal.
- A portal platform that customers can modify or extend to meet their needs.
- Flexibility to host on different infrastructures, including deployment to Azure Static Web Apps or Azure App Service.

## Prerequisites

Before you begin, ensure you have met the following requirements:
1. :white_check_mark: You have installed the latest version of [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
2. :white_check_mark: [Vite package](https://www.npmjs.com/package/vite).
3. :white_check_mark: [Configured app registration in your Microsoft Entra ID tenant](https://learn.microsoft.com/azure/api-center/enable-api-center-portal#create-microsoft-entra-app-registration) with the right API permission scope and Redirect URI.
4. :white_check_mark: Portal sign-in enabled with the [right role assignment](https://learn.microsoft.com/azure/api-center/enable-api-center-portal#enable-sign-in-to-portal-by-microsoft-entra-users-and-groups)


## Quick Start

### Getting Started
Follow these steps to get your development environment set up:

1. Clone the repository

```bash
git clone https://github.com/Azure/APICenter-Portal-Starter.git
```


2. Switch to main branch:

```bash
git checkout main
```

3. Configure the `public/config.json` file to point to your Azure API Center service. Here’s an example configuration:

```JSON
{
  "dataApiHostName": "<service name>.data.<region>.azure-apicenter.ms",
  "title": "API portal",
  "authentication": {
      "clientId": "<client ID>",
      "tenantId": "<tenant ID>",
      "scopes": ["https://azure-apicenter.net/user_impersonation"],
      "authority": "https://login.microsoftonline.com/"
  }
}
```
4. Start the development server - This command will start the portal in development mode running locally:
```bash
npm start
```

5. Build for production - When you’re ready to build for production, run the following command:
```bash
npm start
```

## Contributing

See [the contribution guidelines](CONTRIBUTING.md) for ideas and guidance on how to improve the template. Thank you!


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
