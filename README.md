# Extension Hub for Azure DevOps - Code Securtiy Overview

The Extension Hub is a tool designed for Azure DevOps at the Organization Level, providing centralized information about **Code Vulnerabilities** across projects and repositories.

## Getting Started

### Prerequisites

- **Node.js**: Ensure Node.js is installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

### Technologies Used

This extension leverages several key technologies and libraries:

- **[azure-devops-extension-sdk](https://github.com/Microsoft/azure-devops-extension-sdk)**: For integrating and extending Azure DevOps functionalities.
- **[azure-devops-ui](https://developer.microsoft.com/en-us/azure-devops/)**: For building user interfaces consistent with Azure DevOps.
- **react** (version 16.8.1): A JavaScript library for building user interfaces. This version is compatible with the azure-devops-ui.
- **react-dom** (version 16.8.1): This package serves as the entry point of the DOM-related rendering paths.

## Instalation Instructions & Required Changes

### Installation

1. **Install Dependencies**: Run the following command to install all required dependencies. This command populates the `/node_modules` directory with everything needed.
   ```bash
   npm install
   ```
### Required Changes

You need to set your **ORGANIZATION_NAME** in `src/home/home.tsx` to configure the hub to work properly with your organization.

#### Attributes to change in Manifest Files
For `vss-extension.json`, "id", "author", "name" needs to be changed for yours. You can also change `static/images/icon.png` (Size 220x220).

## Running the Extension Locally
To run the React project on your local machine, follow these steps:
1. **Set Up PAT for Authorisation**: To access all API enpoints, you need to change authorization method in `src/home/home.tsx`, Instead of getting access token with SDK, build up HEADER using your Azure DevOps PAT with Basic Authorization:
   ```typescript
   const personalAccessToken  = "YOUR_PAT"
            const accessToken = btoa(`${personalAccessToken}:`);
            const HEADERS = {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${accessToken}`
            };

   ```
   When chenges are done revert it back to use SDK for getting Acces Token.

2. **Compile the Project**: Compile your project using the command below. This step prepares the project for running locally.
   ```bash
   npm run compile
   ```

3. **Start the Project**: Start the project with the following command. This will serve your project on a local development server.
   ```bash
   npm run start
   ```

4. **Access the Project**: Navigate to https://localhost:3000/home/home.html in your web browser to view the project. Ensure you are accessing the home.html file.

## Release and Deploy

### Manual

To manually update/upload the extension, upload the `.vsix` file to the **[Microsoft Extension Marketplace](https://marketplace.visualstudio.com/)**, use the following steps:

1. **Package the Extension**: Run the following command to package your extension into a `.vsix` file. This process automatically handles versioning. If there's an issue with versioning, you might need to adjust it manually.

   ```bash
    npm run package
   ```

2. **Upload to Microsoft Marketplace**: After packaging, upload the `.vsix` file to the **[Microsoft Extension Marketplace](https://marketplace.visualstudio.com/)** through the Azure DevOps portal.

3. **Share and install**: Share it with your organization and install it.

### Automated
Use **[Azure DevOps Extension Tasks](https://marketplace.visualstudio.com/items?itemName=ms-devlabs.vsts-developer-tools-build-tasks)** for automated release and deploy if code is stored inside a Azure DevOps.

## How to Use
Once the extension is installed you can access an Extension's view at Organization Settings in your Azure DevOps.

You may also need to allow certain permisions to the installed Extenstion, to allow it to access API endpoints.
