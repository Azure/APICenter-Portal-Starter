# Testing Strategy

## Overview

This document outlines the testing, linting, and quality assurance strategy for the project. The codebase currently emphasizes **linting and type checking** for code quality, with **manual testing** as the primary validation method. Automated unit/integration tests are not yet implemented.

---

## Linting

### ESLint Configuration

**File**: `eslint.config.mjs`

**Purpose**: Enforce code style, catch common errors, ensure consistent patterns.

**Config Type**: Flat config (ESLint 9.x format) with TypeScript support.

**Key Rules** (inferred from package.json dependencies):
- TypeScript ESLint rules (`@typescript-eslint/eslint-plugin`)
- React-specific rules (`eslint-plugin-react`, `eslint-plugin-react-hooks`)
- Import order rules (TODO: verify if `eslint-plugin-import` used)

**Run Command**:
```bash
npm run lint
```

**Fix Command**:
```bash
npm run lint:fix
```

**Integration**: Runs on pre-commit hook (via Husky, TODO: verify).

---

### Stylelint Configuration

**Purpose**: Enforce SCSS code style and best practices.

**Config File**: TODO: Verify if `stylelint.config.js` exists.

**Key Rules** (inferred from package.json):
- Standard SCSS rules (`stylelint-config-standard-scss`)
- Order of properties (TODO: verify if `stylelint-order` plugin used)
- No invalid syntax, no duplicate selectors

**Run Command** (if configured):
```bash
npm run lint:styles
```

**Covered Files**: All `.scss` files in `src/`.

---

## Type Checking

### TypeScript Compiler

**File**: `tsconfig.json`

**Strict Mode**: Enabled (`"strict": true`).

**Key Checks**:
- No implicit `any` types
- Strict null checks
- No unused variables/imports
- Strict property initialization

**Run Command**:
```bash
npm run type-check
```
or
```bash
tsc --noEmit
```

**Integration**: Runs in CI/CD (GitHub Actions, TODO: verify).

---

## Quality Gates

### Pre-Commit Hooks

**Tool**: Husky (TODO: verify installation).

**Hooks**:
1. **Pre-commit**: Run linter on staged files (`lint-staged`).
2. **Pre-push**: Run type check (optional, TODO: verify).

**Configuration** (TODO: verify `.husky/` directory):
```bash
# .husky/pre-commit
npm run lint-staged
```

**lint-staged Configuration** (in `package.json`):
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "git add"],
    "*.scss": ["stylelint --fix", "git add"]
  }
}
```

---

### Pull Request Checks

**GitHub Actions** (TODO: verify `.github/workflows/` directory):
1. **Lint**: Run ESLint on all files.
2. **Type Check**: Run `tsc --noEmit`.
3. **Build**: Run `npm run build` (ensure no build errors).
4. **(Future) Tests**: Run unit tests (when implemented).

**Status**: Currently manual review + CI build verification.

---

## Manual Testing

### Local Development Testing

**Process**:
1. Run dev server: `npm run dev`
2. Open browser: `http://localhost:5173`
3. Test features manually:
   - Navigate to `/apis` → verify list renders
   - Select API → verify details page
   - Toggle filters → verify API list updates
   - Test console → send request → verify response
   - Sign in (if auth configured) → verify token in Network tab

**Key Scenarios**:
- **Anonymous mode**: No auth button, API calls work without token.
- **Authenticated mode**: Sign-in flow, token refresh, access control.
- **Error handling**: 401/403 → access denied message, network error → error state.

---

### Deployment Testing

**Process**:
1. Deploy to Azure Static Web Apps (staging slot): `azd deploy`
2. Verify `/config.json` loaded correctly (check Network tab).
3. Test all routes (home, APIs, API detail).
4. Test deep links (e.g., `/apis/petstore?operation=getPetById`).
5. Verify HTTPS, CORS, CSP headers.

**Browser Testing**:
- Chrome (primary)
- Edge (Microsoft stack compatibility)
- Firefox, Safari (cross-browser validation)

---

## Unit Testing (TODO: Implement)

### Recommended Framework

**Tool**: Vitest (fast, Vite-native, Jest-compatible API).

**Why Vitest**:
- Native ESM support
- Fast watch mode
- TypeScript support
- React Testing Library integration

**Installation**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

---

### Test File Structure

**Pattern**: Co-locate tests with components (preferred) or separate `__tests__/` directory.

**Naming**:
- `Component.test.tsx` (co-located)
- `__tests__/Component.test.tsx` (separate directory)

**Example Test**:
```tsx
// src/components/Header/Header.test.tsx
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('APIs')).toBeInTheDocument();
  });

  it('hides sign-in button in anonymous mode', () => {
    // Mock isAnonymousAccessEnabledAtom to return true
    // Assert sign-in button not rendered
  });
});
```

---

### Test Coverage Goals (Future)

**Target**: 80% coverage for critical paths.

**Priority Areas**:
1. **Atoms/Selectors**: State initialization, computed values, effects.
2. **Custom Hooks**: Data fetching, error handling, caching.
3. **Services**: API calls, token acquisition, error handling.
4. **Components**: Rendering, user interactions, conditional logic.

**Run Coverage**:
```bash
npm run test:coverage
```

**Output**: HTML report in `coverage/` directory.

---

## Integration Testing (TODO: Implement)

### Recommended Approach

**Tool**: Vitest + React Testing Library (component integration).

**Scope**: Multi-component workflows (e.g., search → select API → view details).

**Example Test**:
```tsx
describe('API Search Flow', () => {
  it('searches for API and navigates to detail page', async () => {
    render(<App />);
    
    // Type in search box
    const searchBox = screen.getByPlaceholderText('Search APIs...');
    userEvent.type(searchBox, 'petstore');
    
    // Click autocomplete result
    await waitFor(() => screen.getByText('Petstore API'));
    userEvent.click(screen.getByText('Petstore API'));
    
    // Verify navigation to detail page
    expect(screen.getByText('API Details')).toBeInTheDocument();
  });
});
```

---

## End-to-End Testing (TODO: Implement)

### Recommended Framework

**Tool**: Playwright (Microsoft-maintained, Azure DevOps integration).

**Why Playwright**:
- Multi-browser support (Chromium, Firefox, WebKit)
- Auto-wait for elements (no `sleep()` needed)
- Network mocking (intercept API calls)
- Video/screenshot capture on failure

**Installation**:
```bash
npm install -D @playwright/test
npx playwright install
```

**Configuration** (`playwright.config.ts`):
```typescript
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

---

### E2E Test Scenarios

**Priority Scenarios**:
1. **Homepage → API List → API Detail**: Full navigation flow.
2. **Search → Select API → View Operation**: Deep link verification.
3. **Sign-In Flow** (authenticated mode): OAuth redirect, token acquisition.
4. **Filter APIs**: Apply filters → verify list updates.
5. **Test Console**: Send request → verify response rendering.
6. **Anonymous Mode**: Verify auth UI hidden, API calls work without token.

**Example Test**:
```typescript
// e2e/api-detail.spec.ts
import { test, expect } from '@playwright/test';

test('navigates to API detail page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=APIs');
  await page.click('text=Petstore API');
  
  await expect(page).toHaveURL(/\/apis\/petstore/);
  await expect(page.locator('h1')).toContainText('Petstore API');
});
```

**Run Tests**:
```bash
npx playwright test
npx playwright test --ui # Interactive UI mode
```

---

## Mocking Strategies

### Mocking Services (Unit Tests)

**Pattern**: Mock service instances via Recoil overrides (same pattern as `RootProvider`).

**Example**:
```tsx
const mockApiService = {
  getApis: jest.fn().mockResolvedValue([{ name: 'api1', title: 'API 1' }]),
};

const TestProvider = ({ children }) => (
  <RecoilRoot initializeState={({ set }) => {
    set(appServicesAtom, { ApiService: mockApiService });
  }}>
    {children}
  </RecoilRoot>
);

render(<ApisPage />, { wrapper: TestProvider });
```

---

### Mocking API Responses (E2E Tests)

**Pattern**: Intercept network requests with Playwright.

**Example**:
```typescript
await page.route('**/apis', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ value: [{ name: 'api1', title: 'API 1' }] }),
  });
});

await page.goto('/apis');
await expect(page.locator('text=API 1')).toBeVisible();
```

---

## Continuous Integration

### GitHub Actions Workflow (TODO: Verify)

**File**: `.github/workflows/ci.yml`

**Jobs**:
1. **Lint**: Run ESLint and Stylelint.
2. **Type Check**: Run `tsc --noEmit`.
3. **Build**: Run `npm run build`.
4. **(Future) Test**: Run Vitest unit tests.
5. **(Future) E2E**: Run Playwright tests against deployed preview.

**Trigger**: On push to `main` or PR.

**Status Badge**: Display in README.md.

---

## Performance Testing (Future)

### Lighthouse CI

**Purpose**: Automated performance, accessibility, SEO audits.

**Tool**: `@lhci/cli` (Lighthouse CI).

**Metrics**:
- Performance score (target: >90)
- Accessibility score (target: 100)
- Best practices score (target: >90)
- SEO score (target: >90)

**Run**:
```bash
lhci autorun
```

**Integration**: Run in CI after deployment to staging.

---

### Bundle Size Monitoring

**Tool**: `vite-plugin-bundle-analyzer`

**Purpose**: Track bundle size over time, detect regressions.

**Command**:
```bash
npm run build:analyze
```

**Output**: Interactive treemap of bundle composition.

**Budget**: Set size budgets in `vite.config.ts` (warn if exceeded).

---

## Accessibility Testing

### Manual Testing

**Tools**:
- **axe DevTools**: Browser extension for automated a11y checks.
- **NVDA/JAWS**: Screen reader testing (Windows).
- **VoiceOver**: Screen reader testing (macOS).

**Key Checks**:
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader announcements
- Focus indicators (visible focus ring)
- ARIA labels (buttons, links, form fields)
- Color contrast (WCAG AA minimum)

---

### Automated Accessibility Testing (Future)

**Tool**: `axe-core` + `jest-axe`

**Example**:
```tsx
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('Header has no accessibility violations', async () => {
  const { container } = render(<Header />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## TODO: Testing Strategy

- [ ] Verify if Husky pre-commit hooks configured
- [ ] Verify if `stylelint.config.js` exists
- [ ] Implement Vitest unit tests (start with atoms, hooks, services)
- [ ] Implement integration tests (React Testing Library)
- [ ] Implement E2E tests (Playwright)
- [ ] Set up GitHub Actions CI workflow (lint, type-check, build, test)
- [ ] Set up Lighthouse CI for performance monitoring
- [ ] Implement accessibility tests with jest-axe
- [ ] Document test coverage requirements (80%+ for critical paths)
- [ ] Verify if any existing tests (search for `.test.tsx` files)
- [ ] Set up bundle size monitoring and budgets
- [ ] Document mocking patterns for MSAL, fetch, etc.
