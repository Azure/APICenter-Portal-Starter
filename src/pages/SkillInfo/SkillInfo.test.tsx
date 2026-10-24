import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configAtom } from '@/atoms/configAtom';
import { ApiMetadata } from '@/types/api';
import { getSkillSourceUrl, SkillInfo } from './SkillInfo';

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

function renderSkillInfo(apiData: ApiMetadata) {
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

describe('getSkillSourceUrl', () => {
  it('returns undefined when customProperties or sourceUrl is missing, null, or blank', () => {
    expect(getSkillSourceUrl(undefined)).toBeUndefined();
    expect(getSkillSourceUrl({})).toBeUndefined();
    expect(getSkillSourceUrl({ sourceUrl: null })).toBeUndefined();
    expect(getSkillSourceUrl({ sourceUrl: '' })).toBeUndefined();
    expect(getSkillSourceUrl({ sourceUrl: '   ' })).toBeUndefined();
  });

  it('returns the trimmed skill-specific sourceUrl when present', () => {
    expect(
      getSkillSourceUrl({
        sourceUrl: '  https://github.com/owner/repo/tree/main/skills/my-skill  ',
      })
    ).toBe('https://github.com/owner/repo/tree/main/skills/my-skill');
  });
});

describe('SkillInfo', () => {
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

  it('does not render Install in VS Code when customProperties.sourceUrl is missing', () => {
    renderSkillInfo({
      name: 'skill-without-source',
      title: 'Skill Without Source',
      kind: 'skill',
    });

    expect(screen.queryByRole('button', { name: /Install in VS Code/i })).toBeNull();
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
