# Build Error Troubleshooting Guide

This document provides information about common build errors encountered during deployment to Azure Static Web Apps and how to resolve them.

## TypeScript Compilation Errors

### Error: Type 'TOption[]' is not assignable to type 'never[]'

This error occurs when there's a type mismatch between the expected and actual type of an array. The error appeared in the `Filters/index.tsx` file.

**Solution**:

1. Check the interface or type definition for the options property in the related component
2. Ensure the type definition for the `options` property in ApiFilters matches the actual type being used
3. Update the appropriate interface or type definition to correctly specify the type for the array

### Error: Variable is declared but its value is never read

This error appears when a variable is declared but not used anywhere in the code, such as the `settingsCommand` variable in `FirstRow.tsx`.

**Solution**:

1. If the variable is actually needed, use it in your code
2. If the variable is not needed, remove its declaration
3. If you need to keep the variable for future use, prefix it with an underscore (e.g., `_settingsCommand`)

## Build Size Exceeds Limits

When your application build exceeds the size limits for Azure Static Web Apps, you'll see an error like:

```
The size of the app content was too large. The limit for this Static Web App is 262144000 bytes.
```

**Solution**:
See the [Size Limit Troubleshooting Guide](./size-limit-troubleshooting.md) for detailed solutions.

## Node Version Issues

If you see errors related to Node.js version compatibility, ensure:

1. Your workflow is using the correct Node.js version (specified in package.json)
2. All dependencies are compatible with your Node.js version
3. Update your GitHub workflow file if necessary:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
      node-version: "18" # Match this with your package.json
```

## Testing Your Build Locally

Before pushing changes, test your build locally:

```bash
# Install dependencies
yarn install

# Type check
yarn ts

# Build
yarn build
```

This will help identify issues before deployment and save time troubleshooting in the CI/CD pipeline.
