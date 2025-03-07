import React, { useEffect } from 'react';
import { RecoilRoot, RecoilState, useRecoilTransaction_UNSTABLE } from 'recoil';
import { render } from '@testing-library/react';

interface Options {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recoilState?: Array<{ atom: RecoilState<any>; value: unknown }>;
}

interface EnhancedWrapper<P> extends Omit<ReturnType<typeof render>, 'rerender'> {
  rerender: (propsOverride?: Partial<P>, optionsOverride?: Options) => void;
}

interface RecoilTestWrapperProps {
  children: React.ReactNode;
  recoilState?: Options['recoilState'];
}

/**
 * This util allows a simpler way to rerender a component test wrapper based on props, recoil state or external changes.
 */
export default function componentRenderer<P>(element: React.ReactElement<P>, options?: Options): EnhancedWrapper<P> {
  const RecoilUpdateWrapper: React.FC<RecoilTestWrapperProps> = ({ children, recoilState }) => {
    const transact = useRecoilTransaction_UNSTABLE(({ set }) => set);

    useEffect(() => {
      for (const { atom, value } of recoilState) {
        transact(atom, value);
      }
    }, [recoilState, transact]);

    return children;
  };

  const RecoilTestWrapper: React.FC<RecoilTestWrapperProps> = ({ children, recoilState }) => {
    if (!recoilState) {
      return children;
    }

    return (
      <RecoilRoot
        initializeState={({ set }) => {
          for (const { atom, value } of recoilState) {
            set(atom, value);
          }
        }}
      >
        <RecoilUpdateWrapper recoilState={recoilState}>{children}</RecoilUpdateWrapper>
      </RecoilRoot>
    );
  };

  const { type: Component, props: initialProps } = element;
  const wrapper = render(
    <RecoilTestWrapper recoilState={options?.recoilState}>{element}</RecoilTestWrapper>
  ) as unknown as EnhancedWrapper<P>;
  const originalRerender = wrapper.rerender as unknown as ReturnType<typeof render>['rerender'];

  wrapper.rerender = (propsOverride?: Partial<P>, optionsOverride?: Options) => {
    originalRerender(
      <RecoilTestWrapper recoilState={(options?.recoilState || []).concat(optionsOverride?.recoilState || [])}>
        <Component {...initialProps} {...propsOverride} />
      </RecoilTestWrapper>
    );
  };

  return wrapper;
}
