# TODO: Unresolved Questions & Future Research

## Critical Unknowns

### Configuration
- [ ] Verify if `src/config/config.json` exists separate from `src/public/config.json` - purpose/difference?
- [ ] Multi-workspace support implementation plan
- [ ] Scoping filter validation and error handling

### Authentication
- [ ] User profile display implementation (name, avatar, email?)
- [ ] Multi-tenant support verification (common/organizations tenant ID)
- [ ] CORS configuration location (APIM gateway? API Center? Static Web App?)
- [ ] Token refresh strategy (proactive vs reactive)
- [ ] Session timeout handling mechanism
- [ ] Role-based access control implementation (if any)

### API Integration
- [ ] Pagination support via `nextLink` in responses
- [ ] Rate limiting strategy (client-side throttling?)
- [ ] API Center SKU detection mechanism
- [ ] Semantic search backend requirements (Azure AI Search integration?)
- [ ] Custom metadata schema definition and validation
- [ ] API versioning strategy for data plane API (breaking changes)
- [ ] Webhook/notification support for API catalog updates

### Services
- [ ] `McpService` implementation details (methods, protocol, streaming?)
- [ ] `eventsource` package usage (MCP streaming? SSE?)
- [ ] `OAuthService` flow diagrams (authorization code, client credentials)
- [ ] `LocalStorageService` methods and serialization strategy
- [ ] `LocationsService` method signatures
- [ ] Error telemetry service existence and implementation
- [ ] Request retry logic (exponential backoff?)
- [ ] Offline support or offline-first strategy

### State Management
- [ ] `recentSearchesAtom` localStorage persistence verification
- [ ] `appServicesAtom` reactivity to `configAtom` changes (current impl doesn't seem reactive?)
- [ ] Other persisted atoms besides recent searches
- [ ] API spec cache beyond React Query (IndexedDB?)
- [ ] Error telemetry state atoms (if any)

### Dependencies
- [ ] `eventsource` actual usage location and purpose
- [ ] `util` polyfill necessity (can it be removed?)
- [ ] `react-timeago` usage (found in package.json but not in grep results)
- [ ] `rehype-raw` XSS sanitization audit
- [ ] Bundle size optimization (can `lodash` be replaced with native methods?)

### Testing
- [ ] Test file locations (co-located or separate `__tests__/` directories?)
- [ ] Test coverage requirements
- [ ] Integration test strategy
- [ ] E2E test framework (Playwright? Cypress?)
- [ ] Visual regression testing

### Infrastructure
- [ ] `staticwebapp.config.json` existence and full contents
- [ ] Content Security Policy configuration
- [ ] Application Insights SDK integration code
- [ ] Custom domain setup process documentation
- [ ] API Center export/import for backup/migration
- [ ] Multi-region deployment strategy
- [ ] Blue-green deployment support
- [ ] Canary deployment options

### File Structure
- [ ] `src/styles/` directory contents (if any)
- [ ] `src/utils/` files and their purposes
- [ ] Environment-specific configuration file strategy

---

## Feature Completeness Questions

### MCP (Model Context Protocol)
- [ ] Full MCP server protocol documentation
- [ ] MCP streaming implementation (SSE? WebSockets?)
- [ ] MCP test console capabilities
- [ ] MCP authentication flow

### OAuth 2.0 Test Console
- [ ] Supported OAuth flows (authorization code, implicit, client credentials, password?)
- [ ] PKCE support
- [ ] Token storage strategy (memory? sessionStorage?)
- [ ] Refresh token handling
- [ ] Multiple auth provider support (Azure AD, Okta, Auth0?)

### Semantic Search
- [ ] Azure AI Search setup requirements
- [ ] Vector embedding model
- [ ] Search quality tuning options
- [ ] Fallback to text search if semantic unavailable

### API Spec Readers
- [ ] Spec reader registration mechanism
- [ ] Supported spec versions (OpenAPI 2.0, 3.0, 3.1?)
- [ ] AsyncAPI support details
- [ ] gRPC/Protobuf support details
- [ ] WSDL/SOAP support details

---

## Performance Questions

### Optimization
- [ ] Code splitting strategy (per-route? per-feature?)
- [ ] Bundle size budget and monitoring
- [ ] Image optimization (lazy loading, WebP conversion?)
- [ ] Font loading strategy (preload? swap?)
- [ ] Service worker / PWA support

### Caching
- [ ] React Query default stale time per hook
- [ ] HTTP cache duration for GET requests
- [ ] Spec file cache invalidation strategy
- [ ] LocalStorage usage and quota management

---

## Accessibility Questions

- [ ] WCAG 2.1 level (A, AA, AAA target?)
- [ ] Keyboard navigation coverage (all interactive elements?)
- [ ] Screen reader testing process
- [ ] Focus management in modals/dialogs
- [ ] Color contrast compliance verification
- [ ] RTL (right-to-left) language support

---

## Security Audit Needed

- [ ] `rehype-raw` XSS vulnerability surface (sanitization in MarkdownRenderer?)
- [ ] Token storage security (sessionStorage vs localStorage tradeoffs)
- [ ] Content Security Policy full configuration
- [ ] Subresource Integrity (SRI) for CDN resources
- [ ] Dependency vulnerability scanning frequency
- [ ] Security headers configuration (X-Frame-Options, X-Content-Type-Options, etc.)

---

## Documentation Gaps

- [ ] API endpoint pagination implementation examples
- [ ] Custom metadata property usage examples
- [ ] Deployment to App Service step-by-step guide
- [ ] Self-hosted deployment complete guide
- [ ] Environment variable configuration reference
- [ ] Troubleshooting common issues guide
- [ ] Contributing guidelines details
- [ ] Component storybook or visual docs

---

## Future Enhancements (Possible Features)

- [ ] API lifecycle visualization (timeline, stages)
- [ ] Team collaboration features (comments, favorites?)
- [ ] Advanced search filters (regex, date ranges?)
- [ ] API versioning comparison (diff viewer?)
- [ ] CI/CD pipeline integration (API deployment status?)
- [ ] API governance reports (compliance checks?)
- [ ] API usage analytics (if backend supports)
- [ ] Customizable homepage layout
- [ ] Dark mode theme support
- [ ] Multi-language i18n support

---

## Research Topics

### Architecture Evolution
- [ ] Micro-frontend architecture consideration
- [ ] Server-side rendering (SSR) with Next.js?
- [ ] Static site generation (SSG) for API catalog?
- [ ] Edge function integration for auth/routing

### State Management Alternatives
- [ ] Zustand vs Recoil comparison
- [ ] Jotai evaluation for atomic state
- [ ] Redux Toolkit for complex state if needed

### Testing Strategy
- [ ] Component testing with Testing Library
- [ ] E2E testing with Playwright
- [ ] Visual regression with Percy or Chromatic
- [ ] Contract testing for API Center API

### Performance
- [ ] Virtualization for long API lists (react-window?)
- [ ] Infinite scroll vs pagination tradeoffs
- [ ] Web Workers for spec parsing
- [ ] IndexedDB for large spec caching

---

## Decision Log Needed

Track key technical decisions that aren't yet documented:

- [ ] Why Recoil over Redux? (answered in architecture.md, but rationale?)
- [ ] Why React Query over manual fetch? (benefits realized)
- [ ] Why SCSS modules over CSS-in-JS? (maintainability decision)
- [ ] Why Vite over Webpack? (build speed, DX)
- [ ] Why memoizee over custom memoization? (library choice)
- [ ] Why Fluent UI over Material-UI or Chakra? (Microsoft ecosystem alignment)

---

## Verification Checklist

Before marking this documentation as complete:

- [ ] Verify all file paths with actual codebase
- [ ] Test all documented patterns in sample code
- [ ] Confirm all interface signatures match implementations
- [ ] Validate all Bicep template parameter names
- [ ] Check all npm script names in package.json
- [ ] Verify all route paths in React Router
- [ ] Confirm all atom keys match variable names
- [ ] Test all documented azd commands
- [ ] Validate all configuration JSON structures
- [ ] Check all hook names and signatures

---

## When to Update This File

- When discovering answers to any of the above questions
- When implementing new features that were marked as TODO
- When deprecated features are removed
- When major refactors change documented patterns
- When adding new dependencies that require research
- When security audits reveal new concerns

---

## How to Contribute Research Findings

1. Find answer to a question above
2. Document finding in relevant `.md` file (architecture.md, patterns.md, etc.)
3. Remove question from this TODO list
4. Update index.md if new file created
5. Commit with clear message: "docs: answer [question] in [file.md]"
