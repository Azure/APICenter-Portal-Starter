# Deployment & Infrastructure

## Deployment Options

### 1. Azure Static Web Apps (Recommended)

**Tool**: Azure Developer CLI (`azd`)
**Command**: `azd up`
**Automation**: Full infrastructure + deployment

**Resources Created**:
- Azure Static Web App
- Azure API Center (optional, if not using existing)
- Application Insights (if monitoring enabled)
- Log Analytics workspace (if monitoring enabled)

**Benefits**:
- Built-in CDN
- Free SSL/TLS
- Custom domains
- GitHub Actions CI/CD integration
- Global distribution

---

### 2. Azure App Service

**Tool**: Manual or CI/CD
**Resources**: App Service Plan + App Service
**Build**: `npm run build` → Upload `dist/` folder
**Configuration**: App settings for environment variables

---

### 3. Self-Hosted

**Build**: `npm run build` → `dist/` folder
**Server**: Any static file server (nginx, Apache, IIS)
**Requirements**: HTTPS recommended for MSAL
**Configuration**: Manually place `config.json` in `dist/`

---

## Azure Developer CLI (azd)

### Commands

| Command | Purpose |
|---------|---------|
| `azd init` | Initialize azd environment |
| `azd auth login` | Authenticate with Azure |
| `azd up` | Provision + build + deploy |
| `azd provision` | Provision Azure resources only |
| `azd deploy` | Deploy code only (resources exist) |
| `azd down` | Delete all resources |

### Configuration

**File**: `azure.yaml`

```yaml
name: apicenter-portal-starter
services:
  staticapp-portal:
    language: ts
    project: ./
    host: staticwebapp
    dist: dist
```

**Parameters**: `infra/main.parameters.json` or interactive prompts

---

## Infrastructure as Code (Bicep)

### Main Template

**File**: `infra/main.bicep`
**Scope**: Subscription level

**Parameters**:
- `environmentName` - Environment name (generates unique hash)
- `location` - Primary region (eastus, westeurope, etc.)
- `staticAppLocation` - Static Web App region
- `apiCenterExisted` - Use existing API Center?
- `apiCenterName` - API Center name (if existing)
- `apiCenterResourceGroupName` - Resource group (if existing)
- `useMonitoring` - Enable Application Insights?

### Resource Modules

**Location**: `infra/core/`

#### API Center
**Module**: `core/gateway/apicenter.bicep`
**Resources**: Azure API Center instance
**SKU**: Free or Standard (configurable)

#### Static Web App
**Module**: `core/host/staticwebapp.bicep`
**Resources**: Static Web App
**SKU**: Free or Standard
**Configuration**: `staticwebapp.config.json` (routing, headers, etc.)

#### Monitoring (Optional)
**Module**: `core/monitor/`
**Resources**:
- Log Analytics workspace
- Application Insights
- Dashboard

#### Security
**Module**: `core/security/`
**Resources**: Managed identities, RBAC (TODO: verify)

---

## Deployment Hooks

**Location**: `infra/hooks/`

### Pre-Provision (`preprovision.ps1` / `preprovision.sh`)
**Purpose**: Validate prerequisites
**Actions**:
- Check Azure CLI installed
- Verify subscription access
- Validate parameters

### Post-Provision (`postprovision.ps1` / `postprovision.sh`)
**Purpose**: Post-deployment configuration
**Actions**:
- Generate `config.json` from Azure resources
- Set API Center endpoint in config
- Configure CORS (if needed)
- Set up RBAC permissions

### Pre-Deploy (`predeploy.ps1` / `predeploy.sh`)
**Purpose**: Build preparation
**Actions**:
- Run `npm install`
- Generate production config
- Validate environment

### Pre-Up (`preup.ps1` / `preup.sh`)
**Purpose**: Combined provision + deploy preparation
**Actions**: Combination of preprovision + predeploy

### Pre-Down (`predown.ps1` / `predown.sh`)
**Purpose**: Before resource deletion
**Actions**: Backup data, confirm deletion

---

## Configuration Generation

### config.json Generation

**When**: Post-provision hook
**Source**: Azure resource outputs (Bicep outputs)
**Template**:
```json
{
  "dataApiHostName": "<api-center-endpoint>",
  "title": "<environment-name> API Portal",
  "authentication": {
    "clientId": "<app-registration-id>",
    "tenantId": "<tenant-id>",
    "scopes": "https://azure-apicenter.net/Data.Read.All",
    "authority": "https://login.microsoftonline.com/"
  },
  "scopingFilter": "",
  "capabilities": []
}
```

**Destination**: `src/public/config.json` or `dist/config.json`

---

## GitHub Actions Integration

### Workflow Setup

**Command**: `azd pipeline config`

**Actions**:
- Create GitHub repo secrets (Azure credentials)
- Generate `.github/workflows/azure-dev.yml`
- Link to azd environment

### Secrets Required

- `AZURE_CREDENTIALS` - Service principal credentials
- `AZURE_SUBSCRIPTION_ID` - Target subscription
- `AZURE_TENANT_ID` - Azure AD tenant

**Script**: `infra/scripts/Set-GitHubVariables.ps1`

---

## Build Process

### Development Build

```bash
npm run start
# Vite dev server at https://localhost:5173
```

**Features**:
- Hot module replacement
- Source maps
- Basic SSL (self-signed cert)

### Production Build

```bash
npm run build
# Output: dist/
```

**Steps**:
1. TypeScript compilation (`tsc`)
2. Vite build (bundle, minify, optimize)
3. Copy `src/public/` to `dist/`
4. Generate asset hashes

**Output**:
```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── (images, fonts, etc.)
├── config.json
└── index.html
```

---

## Environment-Specific Configuration

### Development
**Config**: `config.example.json` (template)
**API**: Local mock or dev API Center instance
**Auth**: Dev app registration

### Staging
**Config**: Generated by post-provision hook
**API**: Staging API Center instance
**Auth**: Staging app registration

### Production
**Config**: Generated by post-provision hook
**API**: Production API Center instance
**Auth**: Production app registration

---

## Static Web App Configuration

**File**: `staticwebapp.config.json` (if exists, TODO: verify)

**Typical Config**:
```json
{
  "routes": [
    {
      "route": "/config.json",
      "headers": {
        "cache-control": "no-cache"
      }
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/config.json", "/assets/*"]
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self'; ...",
    "x-frame-options": "DENY"
  }
}
```

---

## Deployment Scenarios

### New API Center + Portal

**Steps**:
1. Run `azd up`
2. Enter `apiCenterExisted = false`
3. Leave API Center fields blank
4. Wait for provisioning
5. Access portal at Static Web App URL

**Resources Created**:
- Resource group
- API Center (free SKU)
- Static Web App (free SKU)
- (Optional) Monitoring resources

---

### Existing API Center + New Portal

**Steps**:
1. Run `azd up`
2. Enter `apiCenterExisted = true`
3. Provide API Center name, region, resource group
4. Wait for provisioning
5. Access portal at Static Web App URL

**Resources Created**:
- New resource group (portal resources)
- Static Web App
- (Optional) Monitoring resources

**Resources Used**:
- Existing API Center (no changes)

---

### Manual Deployment

**Build**:
```bash
npm install
npm run build
```

**Deploy**:
```bash
# Azure Static Web Apps
az staticwebapp create ...
az staticwebapp deploy ...

# Azure App Service
az webapp up ...

# Self-hosted
scp -r dist/* user@server:/var/www/portal/
```

**Configure**:
1. Create `config.json` with API Center endpoint
2. Create Azure AD app registration (if authenticated mode)
3. Set redirect URIs in app registration
4. Update `config.json` with auth details
5. Test portal

---

## Monitoring & Observability

### Application Insights (Optional)

**Enabled**: When `useMonitoring = true` in parameters

**Telemetry**:
- Page views
- API call durations
- Client-side errors
- Custom events (TODO: verify if implemented)

**Integration**:
```typescript
// TODO: Verify if AppInsights SDK is used
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
const appInsights = new ApplicationInsights({ config: { ... } });
```

---

### Log Analytics

**Purpose**: Centralized logging
**Linked**: Application Insights → Log Analytics
**Queries**: KQL queries on portal telemetry

---

## Security Configuration

### HTTPS

**Static Web Apps**: Automatic (free Let's Encrypt cert)
**App Service**: Configure custom domain + SSL
**Self-hosted**: Configure web server (nginx, Apache)

### CORS

**Requirement**: API Center must allow portal origin
**Configuration**: TODO: Document where CORS is configured (APIM? API Center?)

### Content Security Policy

**Purpose**: Prevent XSS attacks
**Configuration**: Static Web App global headers
**TODO**: Verify if CSP is configured

---

## Scaling Considerations

### Static Web Apps
**Scaling**: Automatic via CDN
**Limits**: Free tier has bandwidth limits
**Upgrade**: Standard tier for production

### API Center
**Scaling**: Backend service (no manual scaling)
**Limits**: Free tier = 5 APIs max
**Upgrade**: Standard tier for unlimited

---

## Cost Estimation

### Free Tier
- Static Web Apps: $0 (100GB bandwidth/month)
- API Center Free: $0 (5 APIs max)
- **Total**: $0/month (suitable for development)

### Standard Tier
- Static Web Apps: ~$9/month (100GB bandwidth)
- API Center Standard: ~$695/month (unlimited APIs)
- Application Insights: ~$2.30/GB ingested
- **Total**: ~$706+/month (production workload)

**Note**: Prices vary by region and usage

---

## Disaster Recovery

### Backup
- Static Web Apps: Source code in GitHub (re-deployable)
- API Center: Backup APIs via export (TODO: verify export mechanism)
- Config: Store in git (without secrets)

### Recovery
1. Run `azd up` in new environment
2. Restore API Center data (if needed)
3. Update DNS (if custom domain)

---

## TODO: Deployment Questions

- [ ] Verify `staticwebapp.config.json` exists and contents
- [ ] CORS configuration location and method
- [ ] Application Insights integration details
- [ ] Custom domain setup process
- [ ] API Center export/import for backup
- [ ] Multi-region deployment strategy
- [ ] Blue-green deployment support
- [ ] Canary deployment options
