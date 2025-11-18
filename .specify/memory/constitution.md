# Azure API Center Portal Constitution

## Project Purpose

This project provides a **self-hosted web portal for Azure API Center** that enables developers and stakeholders to discover, explore, and interact with APIs managed through Azure API Center's data plane.

### What We Build

A reference implementation of an API discovery and consumption portal that:
- **Enables API Discovery**: Browse and search APIs registered in Azure API Center
- **Supports Multiple Entities**: Display APIs, MCP servers, and other API Center entities
- **Provides Documentation**: View OpenAPI specs, GraphQL schemas, and other API documentation
- **Interactive Testing**: Use built-in test consoles (HTTP and MCP) to try APIs without external tools
- **Flexible Deployment**: Deploy to Azure Static Web Apps, Azure App Service, or self-host anywhere
- **Customizable**: Extensible framework that platform teams can modify to meet their needs

## Core Principles

### I. Azure-Native Architecture
- **Azure Integration First**: Direct integration with Azure API Center data plane API
- **Follow Azure Patterns**: Embrace Azure security, deployment, and operational best practices
- **Infrastructure as Code**: All Azure resources defined in Bicep with `azd` automation
- **Deployment Flexibility**: Support Azure Static Web Apps, App Service, and self-hosted scenarios

### II. Authentication Flexibility
- **Dual Mode Support**: Authenticated (MSAL) and anonymous access modes
- **Config-Driven**: Authentication presence in `config.json` determines mode
- **Graceful Degradation**: UI adapts based on authentication availability
- **No Hard Dependencies**: Features work within authentication constraints

### III. Developer Experience First
- **Frictionless Discovery**: Quick API browsing, filtering, and search
- **Interactive Testing**: Built-in HTTP and MCP test consoles
- **Documentation First**: Clear spec rendering for OpenAPI, GraphQL, etc.
- **VS Code Integration**: Deep links to Azure API Center VS Code extension

### IV. Modern React Patterns
- **TypeScript Everywhere**: All code fully typed with strict mode
- **Functional Components**: React hooks for all component logic
- **Declarative State**: Recoil for global state, React Query for server state
- **Component Composition**: Reusable atoms → components → experiences → pages

### V. Code Quality & Maintainability
- **Linting Enforced**: ESLint + Stylelint must pass before merge
- **Type Safety**: No `any` types without explicit justification
- **SCSS Modules**: Scoped styles, Fluent design tokens
- **Accessibility**: WCAG 2.1 AA compliance required

## Technical Architecture

### Technology Stack

**Core**:
- React 18 + TypeScript (strict mode)
- Vite for fast build and dev server
- Fluent UI React Components (Microsoft design system)

**State Management**:
- Recoil (global application state)
- Recoil Nexus (imperative state access)
- TanStack React Query (server state, caching)

**Authentication**:
- Azure MSAL Browser (when enabled)
- Anonymous auth service (fallback)

**API Interaction**:
- Custom `ApiService` (Azure API Center client)
- `HttpService` (generic HTTP with auth injection)
- Spec readers for OpenAPI, GraphQL, gRPC

**Styling & UI**:
- SCSS modules with Fluent tokens
- React Markdown with rehype/remark plugins
- @microsoft/api-docs-ui for spec rendering

### Project Structure

```
src/
  ├── atoms/           # Recoil state (config, services, auth)
  ├── components/      # Reusable UI (Header, Footer, etc.)
  ├── experiences/     # Feature composites (ApiList, TestConsole)
  ├── hooks/           # Custom hooks (useApi, useApiSpec)
  ├── pages/           # Route pages (Home, ApiDetails)
  ├── services/        # API clients (ApiService, AuthService)
  ├── specReaders/     # Spec parsers (OpenAPI, GraphQL)
  ├── types/           # TypeScript definitions
  └── utils/           # Helpers and utilities

infra/                 # Bicep infrastructure
  ├── main.bicep       # Main deployment template
  ├── hooks/           # azd lifecycle hooks
  └── core/            # Reusable Bicep modules
```

## Development Standards

### Code Patterns

**Service Layer**:
- All API calls go through service classes
- Services registered in `appServicesAtom`
- Swappable implementations (MSAL vs Anonymous)

**State Management**:
- Global config: `configAtom`
- Derived state: selectors compute from config
- Server data: React Query with Recoil integration

**Component Structure**:
```typescript
// Functional component with hooks
export const MyComponent: React.FC<Props> = ({ prop }) => {
  const data = useRecoilValue(myAtom);
  const query = useQuery({ ... });
  
  return <FluentComponent>...</FluentComponent>;
};
```

**Error Handling**:
- Graceful degradation, no crashes
- User-friendly error messages
- Console warnings for dev issues only

### Anti-Patterns to Avoid

1. **Hardcoded Azure endpoints** - Always use `config.json`
2. **Direct fetch calls** - Use `ApiService` or `HttpService`
3. **Auth-only features without guards** - Check `isAnonymousAccessEnabled`
4. **Inline styles** - Use SCSS modules
5. **Committed secrets** - Keep `config.json` in `.gitignore`

### Testing & Quality Gates

**Pre-commit**:
- `npm run lint` must pass (ESLint + Stylelint)
- `npm run build` must succeed (TypeScript + Vite)

**PR Requirements**:
- All linting and build checks green
- Tested in both authenticated and anonymous modes
- Accessibility verified (keyboard nav, screen readers)
- No console errors in production build

## Deployment Context

### Supported Targets

1. **Azure Static Web Apps** (recommended)
   - Automated via `azd up`
   - Built-in CDN and HTTPS
   - Configuration via `staticwebapp.config.json`

2. **Azure App Service**
   - Manual deployment or CI/CD
   - More control over runtime

3. **Self-hosted**
   - Any static file server
   - Customer infrastructure

### Configuration

Runtime config via `src/public/config.json` (or `/config.json`):

```json
{
  "dataApiHostName": "instance.data.region.azure-apicenter.ms",
  "title": "My API Portal",
  "authentication": {  // Optional - omit for anonymous mode
    "clientId": "...",
    "tenantId": "...",
    "scopes": "...",
    "authority": "https://login.microsoftonline.com/"
  }
}
```

### SKU Limitations

- **Free SKU**: Max 5 APIs displayed
- **Standard SKU**: Unlimited APIs

## Security Principles

### Authentication Modes

**Authenticated Mode** (authentication config present):
- MSAL sign-in required
- Token-based API calls
- VS Code integration enabled
- Full feature set

**Anonymous Mode** (authentication config absent):
- No sign-in, immediate access
- Direct API calls without tokens
- VS Code integration hidden
- Suitable for public catalogs

### Security Best Practices

- Secrets only in `config.json` (never committed)
- CORS handled by API Management gateway
- Content Security Policy headers in Azure deployment
- Regular dependency security updates

## Contribution Guidelines

### Workflow

1. Fork and clone the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes with frequent commits
4. Run `npm run lint` and `npm run build`
5. Test both auth modes
6. Submit PR with clear description

### Code Review Checklist

- [ ] Linting passes
- [ ] TypeScript strict mode satisfied
- [ ] Works in authenticated mode
- [ ] Works in anonymous mode
- [ ] No console errors
- [ ] Accessibility maintained
- [ ] Documentation updated (if needed)

### Breaking Changes

- Discuss in issue before implementing
- Document migration path
- Update README and constitution
- Consider backwards compatibility

## Governance

### Constitution Authority

This constitution guides all architectural and development decisions. When in doubt, refer to these principles.

### Amendment Process

1. Propose change via issue or discussion
2. Team review and consensus
3. Update constitution with version bump
4. Communicate to all contributors

### Compliance

- All PRs reviewed against constitution
- Deviations require explicit justification
- Complexity must be validated against simplicity principle

**Version**: 1.0.0 | **Ratified**: 2025-11-17 | **Last Amended**: 2025-11-17
