import React, { useCallback } from 'react';
import { Dropdown, Option } from '@coreai/fluentui-react';
import { useRecoilState } from 'recoil';
import { SortBy, SortByOrder } from '@/types/sorting';
import { apiListSortingAtom } from '@/atoms/apiListSortingAtom';

function sortByToKey(sortBy?: SortBy): string | undefined {
  if (!sortBy) {
    return;
  }

  return `${sortBy.field} ${sortBy.order}`;
}

function keyToSortBy(key: string): SortBy {
  const [field, order] = key.split(' ');
  return { field, order: order as SortByOrder };
}

const options = ['name asc', 'name desc', 'updated desc', 'updated asc'];

const optionLabelByKey = {
  'name asc': 'A to Z, ascending',
  'name desc': 'Z to A, descending',
  'updated asc': 'Oldest to newest',
  'updated desc': 'Newest to oldest',
};

export const ApiListSortingSelect: React.FC = () => {
  const [sortBy, setSortBy] = useRecoilState(apiListSortingAtom);

  const handleOptionSelect = useCallback<React.ComponentProps<typeof Dropdown>['onOptionSelect']>(
    (_, { optionValue }) => {
      setSortBy(keyToSortBy(optionValue));
    },
    [setSortBy]
  );

  return (
    <Dropdown
      value={optionLabelByKey[sortByToKey(sortBy)] || ''}
      selectedOptions={[sortByToKey(sortBy)]}
      inlinePopup
      onOptionSelect={handleOptionSelect}
    >
      {options.map((key) => (
        <Option key={key} value={key}>
          {optionLabelByKey[key]}
        </Option>
      ))}
    </Dropdown>
  );
};

export default React.memo(ApiListSortingSelect);
