import React from 'react';
import { ApiFilterParameters } from '@/config/apiFilters';
import useSearchFilters from '@/hooks/useSearchFilters';
import componentRenderer from '@/testUtils/componentRenderer';
import { ActiveFiltersBadges } from './ActiveFiltersBadges';

let useSearchFiltersResult: ReturnType<typeof useSearchFilters>;
let wrapper: ReturnType<typeof componentRenderer>;

beforeEach(() => {
  useSearchFiltersResult = {
    activeFilters: [
      { type: 'kind', value: 'rest' },
      { type: 'kind', value: 'graphql' },
      { type: 'lifecycleStage', value: 'design' },
    ],
    metadata: ApiFilterParameters,
    isActive: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  };
  vi.mock('@/hooks/useSearchFilters', () => ({
    default: () => useSearchFiltersResult,
  }));

  wrapper = componentRenderer(<ActiveFiltersBadges />);
});

test('should render correctly when there are no filters', () => {
  useSearchFiltersResult.activeFilters = [];
  wrapper.rerender();
  expect(wrapper.baseElement).toMatchSnapshot();
});

test('should render correctly when there are filters', () => {
  expect(wrapper.baseElement).toMatchSnapshot();
});

test('should initiate filter removal on filter remove button click', () => {
  wrapper.container.querySelector<HTMLButtonElement>('button[title="Remove"]').click();
  expect(useSearchFiltersResult.remove).toHaveBeenCalledWith({ type: 'kind', value: 'rest' });
});

test('should initiate removal of all filters on "Clear all" button click', async () => {
  (await wrapper.findByText('Clear all')).click();
  expect(useSearchFiltersResult.clear).toHaveBeenCalled();
});
