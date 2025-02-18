import memoizee from 'memoizee';
import { sortBy } from 'lodash';
import { OperationMetadata } from '@/types/apiSpec';

export const sortOperationsAlphabetically = memoizee((operations: OperationMetadata[]): OperationMetadata[] =>
  sortBy(operations, 'displayName')
);
