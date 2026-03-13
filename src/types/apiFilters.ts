export type FilterType = string;

export type FilterOperator = 'eq' | 'contains';

export interface FilterMetadata {
  label: string;
  options: Array<{ value: string; label: string }>;
}

export interface ActiveFilterData {
  type: FilterType;
  value: string;
  operator?: FilterOperator;
}
