export interface PaginationOpts {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  total: number;
  items: T[];
}
