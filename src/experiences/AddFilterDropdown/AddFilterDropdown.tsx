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
import { ApiFilterParameters } from '@/config/apiFilters';
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
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const filterTypes = Object.entries(searchFilters.metadata).map(([key, meta]) => ({
    key: key as FilterType,
    label: meta.label,
  }));

  const availableValues = selectedFilterType
    ? searchFilters.metadata[selectedFilterType].options
    : [];

  // Multi-value (array) properties allow selecting several values at once via checkboxes.
  const isMultiValue = selectedFilterType
    ? Boolean(searchFilters.metadata[selectedFilterType]?.isMultiValue)
    : false;

  // Filters with a fixed value set (built-in enums or custom enum/multi-select metadata)
  // only support exact matching, so we hide the "Contains" operator for them.
  const isEnumFilter = selectedFilterType
    ? selectedFilterType in ApiFilterParameters || availableValues.length > 0
    : false;

  const resetSelection = useCallback(() => {
    setSelectedFilterType('');
    setSelectedOperator('contains');
    setSelectedValue('');
    setSelectedValues([]);
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedFilterType) return;

    if (isMultiValue) {
      if (!selectedValues.length) return;
      selectedValues
        .filter((value) => !searchFilters.isActive({ type: selectedFilterType, value, operator: 'eq' }))
        .forEach((value) => searchFilters.add({ type: selectedFilterType, value, operator: 'eq' }));
    } else {
      if (!selectedValue) return;
      searchFilters.add({ type: selectedFilterType, value: selectedValue, operator: selectedOperator });
    }

    resetSelection();
    setIsOpen(false);
  }, [searchFilters, selectedFilterType, selectedOperator, selectedValue, selectedValues, isMultiValue, resetSelection]);

  const handleCancel = useCallback(() => {
    resetSelection();
    setIsOpen(false);
  }, [resetSelection]);

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
              const type = data.optionValue as FilterType;
              setSelectedFilterType(type);
              setSelectedValue('');
              setSelectedValues([]);
              const hasFixedOptions =
                type in ApiFilterParameters || (searchFilters.metadata[type]?.options.length ?? 0) > 0;
              if (hasFixedOptions) {
                setSelectedOperator('eq');
              }
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
            {!isEnumFilter && <Option value="contains">Contains</Option>}
            <Option value="eq">Equals</Option>
          </Dropdown>
        </div>

        <div className={styles.field}>
          <Label>Value</Label>
          {selectedFilterType && isMultiValue ? (
            <Dropdown
              multiselect
              placeholder="Select values"
              selectedOptions={selectedValues}
              value={selectedValues
                .map((v) => availableValues.find((o) => o.value === v)?.label ?? v)
                .join(', ')}
              onOptionSelect={(_, data) => setSelectedValues(data.selectedOptions)}
            >
              {availableValues.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Dropdown>
          ) : selectedFilterType && availableValues.length && selectedOperator === 'eq' ? (
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
          <Button
            appearance="primary"
            onClick={handleApply}
            disabled={!selectedFilterType || (isMultiValue ? !selectedValues.length : !selectedValue)}
          >
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
