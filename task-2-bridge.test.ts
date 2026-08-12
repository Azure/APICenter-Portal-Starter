import { beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

describe('Task 2 redirect bridge', () => {
  beforeAll(() => {
    const result = execSync('npm run build', {
      cwd: repoRoot,
      stdio: 'pipe',
      encoding: 'utf8',
    });

    expect(result).toBeDefined();
  });

  it('emits a dedicated entraid redirect bridge without the main app entry', () => {
    const distDir = path.join(repoRoot, 'dist');
    const bridgePath = path.join(distDir, 'entraid-redirect.html');

    expect(existsSync(bridgePath)).toBe(true);

    const bridgeHtml = readFileSync(bridgePath, 'utf8');
    expect(bridgeHtml).not.toContain('/src/main.tsx');

    const bridgeAsset = readdirSync(path.join(distDir, 'assets')).find((name) => name.startsWith('entraidRedirect-'));
    expect(bridgeAsset).toBeDefined();
    expect(bridgeHtml).toContain(`assets/${bridgeAsset}`);

    const bridgeJs = readFileSync(path.join(distDir, 'assets', bridgeAsset!), 'utf8');
    expect(bridgeJs).toContain('BroadcastChannel');
    expect(bridgeJs).not.toContain('react-router-dom');
    expect(bridgeJs).not.toContain('createRoot');
    expect(bridgeJs).not.toContain('RootProvider');
    expect(bridgeJs).not.toContain('HttpService');
  });

  it('registers exact redirect URIs in both provisioning hooks', () => {
    const powershellHook = readFileSync(path.join(repoRoot, 'infra', 'hooks', 'postprovision.ps1'), 'utf8');
    const bashHook = readFileSync(path.join(repoRoot, 'infra', 'hooks', 'postprovision.sh'), 'utf8');

    expect(powershellHook).toContain('http://localhost:5173/entraid-redirect.html');
    expect(powershellHook).toContain('https://localhost:5173/entraid-redirect.html');
    expect(powershellHook).toContain('$env:AZURE_STATIC_APP_URL/entraid-redirect.html');

    expect(bashHook).toContain('http://localhost:5173/entraid-redirect.html');
    expect(bashHook).toContain('https://localhost:5173/entraid-redirect.html');
    expect(bashHook).toContain('$AZURE_STATIC_APP_URL/entraid-redirect.html');
  });
});
