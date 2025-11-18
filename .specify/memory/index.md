# Azure API Center Portal - Documentation Index

Quick navigation to all architectural documentation in `.specify/memory/`.

## Core Documentation

- **[constitution.md](./constitution.md)** - Project principles, values, and governance
- **[architecture.md](./architecture.md)** - High-level architecture overview and layers
- **[dependencies.md](./dependencies.md)** - Third-party packages and their roles
- **[patterns.md](./patterns.md)** - Key design patterns and conventions

## Technical Details

- **[state-management.md](./state-management.md)** - Recoil atoms, selectors, and state flow
- **[services.md](./services.md)** - Service layer architecture and implementations
- **[routing.md](./routing.md)** - Route structure and navigation patterns
- **[components.md](./components.md)** - Component hierarchy and organization

## Integration & Infrastructure

- **[api-integration.md](./api-integration.md)** - Azure API Center data plane integration
- **[authentication.md](./authentication.md)** - Authentication modes and flows
- **[deployment.md](./deployment.md)** - Infrastructure as code and deployment patterns
- **[configuration.md](./configuration.md)** - Runtime configuration and environment setup

## Development

- **[folder-structure.md](./folder-structure.md)** - Directory organization and file conventions
- **[data-flow.md](./data-flow.md)** - Request/response flow and data transformation
- **[testing-strategy.md](./testing-strategy.md)** - Testing approach and quality gates
- **[todo.md](./todo.md)** - Unresolved questions and future research

## Quick Reference

| Concern | File | Key Topics |
|---------|------|------------|
| Project setup | constitution.md | Principles, tech stack, standards |
| System design | architecture.md | Layers, abstractions, boundaries |
| External deps | dependencies.md | npm packages, versions, usage |
| Code patterns | patterns.md | Service layer, hooks, atoms |
| State mgmt | state-management.md | Recoil atoms, selectors, effects |
| Backend calls | services.md | ApiService, HttpService, auth |
| API Center | api-integration.md | Data plane APIs, endpoints |
| Auth modes | authentication.md | MSAL vs anonymous flows |
| Infrastructure | deployment.md | Bicep, azd, Static Web Apps |
| Config | configuration.md | config.json, runtime settings |
| File org | folder-structure.md | src/ layout, naming conventions |
| Data flow | data-flow.md | Fetch → transform → render |
| Testing | testing-strategy.md | Linting, type checking, quality |
| TODOs | todo.md | Unknowns, research topics |

## Usage for AI Development

When starting a new task:
1. Review **constitution.md** for project principles
2. Check **architecture.md** for system boundaries
3. Consult relevant technical docs (state, services, etc.)
4. Verify patterns in **patterns.md** before implementing
5. Update **todo.md** when encountering unknowns

When modifying code:
1. Check **folder-structure.md** for file placement
2. Review **data-flow.md** for impact analysis
3. Follow **patterns.md** conventions
4. Update relevant docs if adding new patterns

When debugging:
1. Trace through **data-flow.md**
2. Check **state-management.md** for atom dependencies
3. Review **authentication.md** for auth-related issues
4. Consult **api-integration.md** for backend problems
