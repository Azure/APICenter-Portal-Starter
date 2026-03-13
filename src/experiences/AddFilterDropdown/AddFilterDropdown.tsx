import React, { useCallback, useState } from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Dropdown,
  Option,
  Input,
  Label,
} from '@fluentui/react-components';
import { FilterRegular } from '@fluentui/react-icons';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { FilterType, FilterOperator } from '@/types/apiFilters';
import styles from './AddFilterDropdown.module.scss';

const operatorLabels: Record<FilterOperator, string> = {
  eq: 'Equals',
  contains: 'Contains',
};

export const AddFilterDropdown: React.FC = () => {
  const searchFilters = useSearchFilters();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState<FilterType | ''>('');
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>('contains');
  const [selectedValue, setSelectedValue] = useState('');

  const filterTypes = Object.entries(searchFilters.metadata).map(([key, meta]) => ({
    key: key as FilterType,
    label: meta.label,
  }));

  const availableValues = selectedFilterType
    ? searchFilters.metadata[selectedFilterType].options
    : [];

  const handleApply = useCallback(() => {
    if (selectedFilterType && selectedValue) {
      searchFilters.add({ type: selectedFilterType, value: selectedValue, operator: selectedOperator });
      setSelectedFilterType('');
      setSelectedOperator('contains');
      setSelectedValue('');
      setIsOpen(false);
    }
  }, [searchFilters, selectedFilterType, selectedOperator, selectedValue]);

  const handleCancel = useCallback(() => {
    setSelectedFilterType('');
    setSelectedOperator('contains');
    setSelectedValue('');
    setIsOpen(false);
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)} positioning="below-end">
      <PopoverTrigger>
        <Button appearance="secondary" icon={<FilterRegular />} style={{ whiteSpace: 'nowrap' }}>
          Add filter
        </Button>
      </PopoverTrigger>
      <PopoverSurface className={styles.surface}>
        <h4 className={styles.heading}>Filter</h4>

        <div className={styles.field}>
          <Label>Property</Label>
          <Dropdown
            placeholder="Select options"
            value={selectedFilterType ? searchFilters.metadata[selectedFilterType].label : ''}
            onOptionSelect={(_, data) => {
              setSelectedFilterType(data.optionValue as FilterType);
              setSelectedValue('');
            }}
          >
            {filterTypes.map((ft) => (
              <Option key={ft.key} value={ft.key}>{ft.label}</Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.field}>
          <Label>Operator</Label>
          <Dropdown
            value={operatorLabels[selectedOperator]}
            onOptionSelect={(_, data) => setSelectedOperator(data.optionValue as FilterOperator)}
          >
            <Option value="contains">Contains</Option>
            <Option value="eq">Equals</Option>
          </Dropdown>
        </div>

        <div className={styles.field}>
          <Label>Value</Label>
          {selectedFilterType && availableValues.length && selectedOperator === 'eq' ? (
            <Dropdown
              placeholder="Search"
              value={selectedValue ? availableValues.find((v) => v.value === selectedValue)?.label ?? '' : ''}
              onOptionSelect={(_, data) => setSelectedValue(data.optionValue as string)}
            >
              {availableValues.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Dropdown>
          ) : (
            <Input
              placeholder="Search"
              disabled={!selectedFilterType}
              value={selectedValue}
              onChange={(_, data) => setSelectedValue(data.value)}
            />
          )}
        </div>

        <div className={styles.actions}>
          <Button appearance="primary" onClick={handleApply} disabled={!selectedFilterType || !selectedValue}>
            Apply
          </Button>
          <Button appearance="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </PopoverSurface>
    </Popover>
  );
};

export default React.memo(AddFilterDropdown);
