import React from 'react';
import { useOutlet } from 'react-router-dom';
import { Mock } from 'vitest';
import componentRenderer from '@/testUtils/componentRenderer';
import mockChildComponent from '@/testUtils/mockChildComponent';
import { setDocumentTitle } from '@/utils/dom';
import isAuthenticatedAtom from '@/atoms/isAuthenticatedAtom';
import isAccessDeniedAtom from '@/atoms/isAccessDeniedAtom';
import { Home } from './Home';

let wrapper: ReturnType<typeof componentRenderer>;

vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal<object>();
  return {
    ...original,
    useOutlet: vi.fn(),
  };
});

vi.mock('@/utils/dom', () => ({
  setDocumentTitle: vi.fn(),
}));

vi.mock('@/experiences/ApiList', () => ({ default: mockChildComponent('ApiList') }));
vi.mock('@/experiences/ApiSearchBox', () => ({ default: mockChildComponent('ApiSearchBox') }));
vi.mock('@/experiences/ApiFilters', () => ({ default: mockChildComponent('ApiFilters') }));
vi.mock('@/experiences/ApiListLayoutSwitch', () => ({ default: mockChildComponent('ApiListLayoutSwitch') }));
vi.mock('@/experiences/ApiListSortingSelect', () => ({ default: mockChildComponent('ApiListSortingSelect') }));
vi.mock('@/experiences/ActiveFiltersBadges', () => ({ default: mockChildComponent('ActiveFiltersBadges') }));

beforeEach(() => {
  wrapper = componentRenderer(<Home />, {
    recoilState: [
      { atom: isAuthenticatedAtom, value: true },
      { atom: isAccessDeniedAtom, value: false },
    ],
  });
});

test('should render correctly in default state', () => {
  expect(wrapper.baseElement).toMatchSnapshot();
});

test('should render sign in required message if the user is not authenticated', () => {
  wrapper.rerender(
    {},
    {
      recoilState: [{ atom: isAuthenticatedAtom, value: false }],
    }
  );

  expect(wrapper.baseElement).toMatchSnapshot();
});

test('should render an access denied message if user does not have access to the portal', () => {
  wrapper.rerender(
    {},
    {
      recoilState: [{ atom: isAccessDeniedAtom, value: true }],
    }
  );

  expect(wrapper.baseElement).toMatchSnapshot();
});

test('should set document title if there are no nested pages', () => {
  expect(setDocumentTitle).toHaveBeenCalledWith('API portal (preview)');
});

test('should not set document title if there is a nested page', () => {
  vi.resetAllMocks();
  (useOutlet as Mock).mockReturnValue('outlet');
  wrapper.rerender();
  expect(setDocumentTitle).not.toHaveBeenCalled();
});
