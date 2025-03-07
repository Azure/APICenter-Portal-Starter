import { RecoilRoot, useRecoilState } from 'recoil';
import { renderHook, act } from '@testing-library/react';
import LocalStorageService from '@/services/LocalStorageService';
import apiListLayoutAtom from '../apiListLayoutAtom';

let hook: ReturnType<typeof renderHook>;

beforeEach(() => {
  vi.spyOn(LocalStorageService, 'set');

  hook = renderHook(() => useRecoilState(apiListLayoutAtom), { wrapper: RecoilRoot });
});

test('should persist state in local storage on set', () => {
  const value = 'new-layout';
  act(() => hook.result.current[1](value));
  expect(LocalStorageService.set).toHaveBeenCalledWith(LocalStorageService.StorageKeys.API_LIST_LAYOUT, value);
});
