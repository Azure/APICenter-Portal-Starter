import { describe, expect, it } from 'vitest';
import { ApiMetadata } from '@/types/api';
import { getNavigationTarget } from './ApiSearchAutoComplete';

function createApi(kind?: string): ApiMetadata {
  return {
    name: 'petstore',
    title: 'Pet Store',
    kind,
  };
}

describe('getNavigationTarget', () => {
  it('sets the selected API as the search query and opens its drawer', () => {
    window.history.replaceState({}, '', '/?view=grid');

    expect(getNavigationTarget(createApi('REST'))).toEqual({
      to: '/?view=grid&search=petstore',
      state: { drawer: { kind: 'api', name: 'petstore' } },
    });
  });

  it('keeps dedicated asset routes unchanged', () => {
    expect(getNavigationTarget(createApi('skill'))).toEqual({
      to: '/skills/petstore',
    });
  });
});
