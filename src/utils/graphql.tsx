import React from 'react';
import {
  GraphQLType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from 'graphql';
import { Link } from '@fluentui/react-components';

export function getUsedRefsForType(type: GraphQLType, acc: string[] = []): string[] {
  let result = acc.slice();
  if (isScalarType(type)) {
    return result;
  }

  if (isNonNullType(type) || isListType(type)) {
    return getUsedRefsForType(type.ofType, result);
  }

  if (isObjectType(type) || isInputObjectType(type) || isInterfaceType(type)) {
    if (result.includes(type.name)) {
      return result;
    }

    result.push(type.name);
    for (const field of Object.values(type.getFields())) {
      result = getUsedRefsForType(field.type, result);
    }
  }

  if (isEnumType(type) && !result.includes(type.name)) {
    result.push(type.name);
  }

  return result;
}

export function gqlTypeToLabel(type: GraphQLType): React.ReactNode {
  if (isNonNullType(type)) {
    return <>{gqlTypeToLabel(type.ofType)}!</>;
  }

  if (isListType(type)) {
    return <>[{gqlTypeToLabel(type.ofType)}]</>;
  }

  if (isScalarType(type)) {
    return type.name;
  }

  if (isObjectType(type) || isInputObjectType(type) || isInterfaceType(type) || isEnumType(type)) {
    return <Link href={`#${type.name}`}>{type.name}</Link>;
  }

  return 'unknown';
}
