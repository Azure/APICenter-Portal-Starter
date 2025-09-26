export type FilterType = 'kind' | 'lifecycleStage';

export interface FilterMetadata {
  label: string;
  options: Array<{ value: string; label: string }>;
}

export interface ActiveFilterData {
  type: FilterType;
  value: string;
}
