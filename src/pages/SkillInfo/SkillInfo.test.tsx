import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configAtom } from '@/atoms/configAtom';
import { ApiMetadata } from '@/types/api';
import { Config } from '@/types/config';
import { SkillInfo } from './SkillInfo';

const mocks = vi.hoisted(() => ({
  useApi: vi.fn(),
  useAIAssetVersions: vi.fn(),
  useAIAssetDefinition: vi.fn(),
  useAIAssetEvaluationResult: vi.fn(),
}));

vi.mock('@/hooks/useApi', () => ({
  useApi: (...args: unknown[]) => mocks.useApi(...args),
}));

vi.mock('@/hooks/useAIAssetVersions', () => ({
  useAIAssetVersions: (...args: unknown[]) => mocks.useAIAssetVersions(...args),
}));

vi.mock('@/hooks/useAIAssetDefinition', () => ({
  useAIAssetDefinition: (...args: unknown[]) => mocks.useAIAssetDefinition(...args),
}));

vi.mock('@/hooks/useAIAssetEvaluationResult', () => ({
  useAIAssetEvaluationResult: (...args: unknown[]) => mocks.useAIAssetEvaluationResult(...args),
}));

function renderSkillInfo(apiData: ApiMetadata, authentication?: Config['authentication']) {
  mocks.useApi.mockReturnValue({
    data: apiData,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });

  return render(
    <RecoilRoot
      initializeState={({ set }) => {
        set(configAtom, {
          dataApiHostName: 'example.data.eastus.azure-apicenter.ms',
          title: 'API portal',
          scopingFilter: '',
          capabilities: [],
          authentication,
        });
      }}
    >
      <MemoryRouter initialEntries={[`/skills/${apiData.name}`]}>
        <Routes>
          <Route path="/skills/:name" element={<SkillInfo />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  );
}

describe('SkillInfo', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAIAssetVersions.mockReturnValue({ data: [], isLoading: false });
    mocks.useAIAssetDefinition.mockReturnValue({ data: undefined, isLoading: false });
    mocks.useAIAssetEvaluationResult.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetched: true,
      isFetching: false,
    });
  });

  it('disables Install in VS Code with guidance when the skill has no installable source', () => {
    renderSkillInfo({
      name: 'skill-without-source',
      title: 'Skill Without Source',
      kind: 'skill',
    });

    const installButton = screen.getByRole('button', { name: /Install in VS Code/i });
    expect(installButton.getAttribute('aria-disabled')).toBe('true');
  });

  it('opens a deeplink with the API Center source when the portal uses Entra ID authentication', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderSkillInfo(
      { name: 'my-skill', title: 'My Skill', kind: 'skill' },
      { clientId: 'client-id', tenantId: 'tenant-id', scopes: [], authority: '', azureAdInstance: '' }
    );

    fireEvent.click(screen.getByRole('button', { name: /Install in VS Code/i }));

    expect(openSpy).toHaveBeenCalledWith(
      'vscode://apidev.azure-api-center/install?name=my-skill&dataApiHost=example.data.eastus.azure-apicenter.ms&workspace=default&clientId=client-id&tenantId=tenant-id'
    );

    openSpy.mockRestore();
  });

  it('uses the Git source folder URL resolved by API Center when sourceUrl is not set', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderSkillInfo({
      name: 'my-skill',
      title: 'My Skill',
      kind: 'skill',
      source: { type: 'git', url: 'https://github.com/owner/repo/tree/main/skills/my-skill' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Install in VS Code/i }));

    expect(openSpy).toHaveBeenCalledWith(
      'vscode://apidev.azure-api-center/install?sourceUrl=https%3A%2F%2Fgithub.com%2Fowner%2Frepo%2Ftree%2Fmain%2Fskills%2Fmy-skill&name=my-skill'
    );

    openSpy.mockRestore();
  });

  it('opens a skill-specific VS Code deeplink when customProperties.sourceUrl is present', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderSkillInfo({
      name: 'my-skill',
      title: 'My Skill',
      kind: 'skill',
      customProperties: {
        sourceUrl: 'https://github.com/owner/repo/tree/main/skills/my-skill',
      },
    });

    const installButton = screen.getByRole('button', { name: /Install in VS Code/i });
    fireEvent.click(installButton);

    expect(openSpy).toHaveBeenCalledWith(
      'vscode://apidev.azure-api-center/install?sourceUrl=https%3A%2F%2Fgithub.com%2Fowner%2Frepo%2Ftree%2Fmain%2Fskills%2Fmy-skill&name=my-skill'
    );

    openSpy.mockRestore();
  });
});
