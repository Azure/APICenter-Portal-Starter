export enum SortByOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface SortBy {
  field: string;
  order: SortByOrder;
}
