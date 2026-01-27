# Folder Structure & File Conventions

## Root Structure

```
APICenter-Portal-Starter/
├── .github/               # GitHub Actions, prompts
├── .specify/              # Project documentation
│   └── memory/            # Architecture docs (this folder)
├── infra/                 # Azure infrastructure (Bicep)
├── src/                   # Application source code
├── azure.yaml             # Azure Developer CLI config
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── eslint.config.mjs      # ESLint rules
└── README.md              # Project documentation
```

---

## src/ Directory

```
src/
├── atoms/                 # Recoil state atoms and selectors
├── assets/                # Static assets (images, SVGs)
├── components/            # Reusable UI components
├── config/                # Application configuration files
├── constants/             # Shared constants
├── experiences/           # Feature-specific composite components
├── hooks/                 # Custom React hooks
├── pages/                 # Route-level page components
├── public/                # Public assets (served as-is)
├── services/              # Service layer (API clients, auth)
├── specReaders/           # API spec parsers
├── styles/                # Global styles
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── App.tsx                # Root application component
├── Layout.tsx             # Page layout component
├── RootProvider.tsx       # Recoil root provider
├── main.tsx               # Entry point
├── globals.scss           # Global styles
├── constants.ts           # App-level constants
└── vite-env.d.ts          # Vite type definitions
```

---

## Detailed Directory Breakdown

### atoms/

**Purpose**: Recoil state management
**Naming**: `[feature][State]Atom.ts`

```
atoms/
├── apiListLayoutAtom.ts           # API list layout preference
├── apiListSortingAtom.ts          # API list sorting preference
├── apiSearchFiltersAtom.ts        # Active search filters
├── appServicesAtom.ts             # Service instances (writable selector)
├── configAtom.ts                  # Application configuration
├── isAccessDeniedAtom.ts          # Access denied flag
├── isAnonymousAccessEnabledAtom.ts # Anonymous mode detection
├── isAuthenticatedAtom.ts         # Authentication state
└── recentSearchesAtom.ts          # Recent search history
```

**Convention**: One atom/selector per file

---

### assets/

**Purpose**: Static images, SVGs, icons

```
assets/
├── accessDenied.svg
├── devPortal.png
├── logo.svg
├── noResults.svg
├── semanticSearch.svg
├── vsCodeInsidersLogo.svg
└── vsCodeLogo.svg
```

**Usage**: Imported in components via `import Logo from '@/assets/logo.svg'`

---

### components/

**Purpose**: Reusable, composable UI components

```
components/
├── ApiAuthForm/
├── CopyLink/
├── CustomMetadata/
├── EmptyStateMessage/
├── Footer/
├── Header/
│   ├── AuthBtn/              # Nested component
│   ├── Header.tsx
│   └── Header.module.scss
├── MarkdownRenderer/
├── ParamSchemaDefinition/
├── RefLink/
├── SemanticSearchToggle/
└── TestConsoleError/
```

**Structure**:
- Each component in its own folder
- Component file: `ComponentName.tsx`
- Styles: `ComponentName.module.scss`
- Nested components: Sub-folders

**Convention**: PascalCase folder and file names

---

### config/

**Purpose**: App configuration (not runtime config)

```
config/
├── apiFilters.ts          # Filter configuration
└── config.json            # Static config (TODO: verify purpose vs public/config.json)
```

---

### constants/

**Purpose**: Shared constant values

```
constants/
├── HttpStatusCodes.ts     # HTTP status code enums
└── urlParams.ts           # URL parameter constants
```

**Also**: `src/constants.ts` (app-level constants)

---

### experiences/

**Purpose**: Feature-specific composite components (business logic + UI)

```
experiences/
├── ActiveFiltersBadges/
├── ApiAccessAuthForm/
├── ApiAdditionalInfo/
├── ApiDefinitionSelect/
├── ApiFilters/
├── ApiInfoOptions/
├── ApiList/
├── ApiListLayoutSwitch/
├── ApiListSortingSelect/
├── ApiOperationDetails/
├── ApiOperationsSelect/
├── ApiSearchBox/
├── HttpTestConsole/
└── McpTestConsole/
```

**Distinction from components/**:
- **Experiences**: Feature orchestration, business logic, multi-component composition
- **Components**: Low-level reusable UI, minimal logic

---

### hooks/

**Purpose**: Custom React hooks

```
hooks/
├── useApi.ts                      # Fetch single API
├── useApiAuthorization.ts         # API auth handling
├── useApiAuthSchemes.ts           # Auth scheme fetching
├── useApiDefinition.ts            # Fetch single definition
├── useApiDefinitions.ts           # Fetch definitions
├── useApiDeployments.ts           # Fetch deployments
├── useApis.ts                     # Fetch API list
├── useApiService.ts               # Access ApiService
├── useApiSpec.ts                  # Fetch and parse spec
├── useApiSpecUrl.ts               # Get spec URL
├── useApiVersions.ts              # Fetch versions
├── useAuthService.ts              # Access AuthService
├── useDeploymentEnvironment.ts    # Fetch environment
├── useHttpTestRequestController.ts # HTTP test console logic
├── useMcpTestRunController.ts     # MCP test console logic
├── useRecentSearches.ts           # Recent searches management
├── useSearchFilters.ts            # Filter management
├── useSearchQuery.ts              # Search orchestration
├── useSelectedOperation.ts        # Operation selection state
└── useServer.ts                   # Fetch MCP server
```

**Naming**: `use[Feature].ts`, camelCase
**Pattern**: Service access + React Query + business logic

---

### pages/

**Purpose**: Route-level page components

```
pages/
├── ApiInfo/
│   └── ApiInfo.tsx
├── ApiSpec/
│   └── ApiSpec.tsx
└── Home/
    └── Home.tsx
```

**Routes**:
- `/` → Home
- `/api-info/:id` → ApiInfo (nested in Home)
- `/apis/:apiName/versions/:versionName/definitions/:definitionName` → ApiSpec

---

### public/

**Purpose**: Static files served as-is (not processed by Vite)

```
public/
└── config.json            # Runtime configuration (fetched on app mount)
```

**Note**: Files in `src/public/` are copied to `dist/` during build

---

### services/

**Purpose**: API clients, auth, and external service integrations

```
services/
├── AnonymousAuthService.ts
├── ApiService.ts
├── HttpService.ts
├── LocalStorageService.ts
├── LocationsService.ts
├── McpService.ts
├── MsalAuthService.ts
└── OAuthService.ts
```

**Naming**: `[Feature]Service.ts`, PascalCase

---

### specReaders/

**Purpose**: Parse different API specification formats

```
specReaders/
├── getSpecReader.ts           # Reader factory
├── graphqlReader.ts           # GraphQL schema parser
├── mcpReader.ts               # MCP spec parser
├── openApiResolverProxy.ts    # OpenAPI $ref resolver
├── openApiV2Reader.ts         # OpenAPI 2.0 (Swagger)
└── openApiV3Reader.ts         # OpenAPI 3.x
```

**Pattern**: Reader factory returns appropriate parser based on spec type

---

### styles/

**Purpose**: Global stylesheets

```
styles/
└── (TODO: List files if exist)
```

**Also**: `src/globals.scss` (global styles imported in main.tsx)

---

### types/

**Purpose**: TypeScript type definitions

```
types/
├── services/
│   ├── IApiService.ts         # ApiService interface
│   └── IAuthService.ts        # AuthService interface
├── api.ts                     # API metadata types
├── apiAuth.ts                 # Auth scheme types
├── apiDefinition.ts           # API definition types
├── apiDeployment.ts           # Deployment types
├── apiEnvironment.ts          # Environment types
├── apiFilters.ts              # Filter types
├── apiSpec.ts                 # Spec types (OpenAPI, GraphQL, etc.)
├── apiVersion.ts              # Version types
├── appConfig.ts               # App config types
├── config.ts                  # Runtime config types
├── layouts.ts                 # Layout types
├── mcp.ts                     # MCP types
├── msalSettings.ts            # MSAL types
├── server.ts                  # MCP server types
└── sorting.ts                 # Sorting types
```

**Naming**: camelCase file names, PascalCase types

---

### utils/

**Purpose**: Pure utility functions

```
utils/
└── (TODO: List files)
```

---

## infra/ Directory

**Purpose**: Azure infrastructure as code (Bicep)

```
infra/
├── core/
│   ├── gateway/
│   │   └── apicenter.bicep    # API Center resource
│   ├── host/
│   │   └── staticwebapp.bicep # Static Web App resource
│   ├── monitor/
│   │   └── (monitoring resources)
│   └── security/
│       └── (security resources)
├── hooks/
│   ├── load_azd_env.ps1       # Load azd environment variables
│   ├── load_azd_env.sh
│   ├── login.ps1              # Azure login
│   ├── login.sh
│   ├── postprovision.ps1      # Post-provision steps
│   ├── postprovision.sh
│   ├── predeploy.ps1          # Pre-deployment steps
│   ├── predeploy.sh
│   ├── predown.ps1            # Pre-teardown steps
│   ├── predown.sh
│   ├── preprovision.ps1       # Pre-provision steps
│   ├── preprovision.sh
│   ├── preup.ps1              # Pre-up steps
│   └── preup.sh
├── scripts/
│   ├── Get-AzdVariable.ps1
│   ├── get-azdvariable.sh
│   ├── Set-GitHubVariables.ps1
│   └── set-githubvariables.sh
├── abbreviations.json         # Azure resource name abbreviations
├── main.bicep                 # Main Bicep template
└── main.parameters.json       # Bicep parameters
```

---

## File Naming Conventions

### React Components
- **Files**: PascalCase (`Header.tsx`)
- **Folders**: PascalCase (`Header/`)
- **Styles**: `ComponentName.module.scss`

### Hooks
- **Files**: camelCase starting with `use` (`useApi.ts`)
- **Functions**: Same as file name (`export const useApi = () => {}`)

### Services
- **Files**: PascalCase ending with `Service` (`ApiService.ts`)
- **Exports**: Same as file name (`export const ApiService = {}`)

### Atoms/Selectors
- **Files**: camelCase ending with `Atom` (`configAtom.ts`)
- **Exports**: Same as file name (`export const configAtom = atom({})`)

### Types
- **Files**: camelCase (`api.ts`, `apiDefinition.ts`)
- **Types/Interfaces**: PascalCase (`export interface ApiMetadata {}`)

### Utils
- **Files**: camelCase describing purpose (`formatDate.ts`)
- **Functions**: camelCase (`export const formatDate = () => {}`)

---

## Import Path Aliases

**Configuration**: `vite.config.ts`

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

**Usage**:
```typescript
import { configAtom } from '@/atoms/configAtom';
import { ApiService } from '@/services/ApiService';
import Header from '@/components/Header';
```

**Benefits**: Absolute imports, no `../../../` hell

---

## Build Output

**Development**: `npm run start` (Vite dev server)
**Production**: `npm run build` → `dist/` folder

```
dist/
├── assets/
│   ├── index-[hash].js        # Bundled JS
│   └── index-[hash].css       # Bundled CSS
├── config.json                # Copied from src/public/
└── index.html                 # Entry HTML
```

---

## Configuration Files

### Root Level

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, engines |
| `tsconfig.json` | TypeScript compiler options |
| `vite.config.ts` | Vite bundler configuration |
| `eslint.config.mjs` | ESLint rules |
| `azure.yaml` | Azure Developer CLI configuration |

### .github/

| File | Purpose |
|------|---------|
| `workflows/` | GitHub Actions CI/CD |
| `prompts/` | AI prompt templates (Specify) |

---

## Git Ignored Files

**Key Ignored**:
- `node_modules/`
- `dist/`
- `.env*`
- `src/public/config.json` (runtime config, not committed)

**Why config.json Ignored**: Contains environment-specific values (API hostnames, client IDs)

---

## File Organization Best Practices

### Component Files
```
components/MyComponent/
├── MyComponent.tsx              # Main component
├── MyComponent.module.scss      # Styles
├── MyComponent.test.tsx         # Tests (if any)
├── SubComponent/                # Nested component
│   ├── SubComponent.tsx
│   └── SubComponent.module.scss
└── index.ts                     # Re-export (optional)
```

### Page Files
```
pages/MyPage/
├── MyPage.tsx                   # Main page component
├── MyPage.module.scss           # Page styles
└── components/                  # Page-specific components (if needed)
```

### Hook Files
- One hook per file
- Named exports preferred
- Co-locate types in same file if specific to hook

### Service Files
- One service per file
- Export as const object implementing interface
- Interface in `types/services/`

---

## TODO: File Structure Questions

- [ ] Verify `src/config/config.json` vs `src/public/config.json` purpose
- [ ] Document `src/styles/` contents (if any)
- [ ] Document `src/utils/` files
- [ ] Clarify test file locations (co-located or separate `__tests__/`?)
- [ ] Document environment-specific configuration strategy
