import React from 'react';
import { kebabCase } from 'lodash';

function serializeProps(props: object): object {
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => {
      if (value instanceof Function) {
        return [key, 'function'];
      }

      return [key, value];
    })
  );
}

/**
 * This util will return a mocked version of a child component preserving its props (serialized).
 */
export default function mockChildComponent(name: string): React.FC {
  const MockComponent: React.FC = (props?: object) => {
    return React.createElement(kebabCase(name), serializeProps(props));
  };
  MockComponent.displayName = name;

  return MockComponent;
}
