export function calcTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

export function calcLastPageOffset(total: number, limit: number): number {
  return Math.max(0, calcTotalPages(total, limit) - 1) * limit;
}
