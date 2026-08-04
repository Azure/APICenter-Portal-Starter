export type FilterType = string;

export type FilterOperator = 'eq' | 'contains';

export interface FilterMetadata {
  label: string;
  options: Array<{ value: string; label: string }>;
  /** True when the property holds an array of values (multi-select). */
  isMultiValue?: boolean;
}

export interface ActiveFilterData {
  type: FilterType;
  value: string;
  operator?: FilterOperator;
  /** True when the property holds an array of values, requiring lambda (`any`) filtering. */
  isMultiValue?: boolean;
}
