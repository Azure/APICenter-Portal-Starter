import React from 'react';
import { RecoilRoot } from 'recoil';
import RecoilNexus from 'recoil-nexus';
import appServicesAtom, { AppServicesAtomState } from '@/atoms/appServicesAtom';

interface Props {
  children: React.ReactNode;
  services?: Partial<AppServicesAtomState>;
}

export const RootProvider: React.FC<Props> = ({ children, services }) => {
  return (
    <RecoilRoot
      initializeState={({ set, getLoadable }) => {
        const defaultServices = getLoadable(appServicesAtom).contents;
        set(appServicesAtom, { ...defaultServices, ...services });
      }}
    >
      <RecoilNexus />
      {children}
    </RecoilRoot>
  );
};

export default RootProvider;
