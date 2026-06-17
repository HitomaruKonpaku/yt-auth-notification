import type { ValueTransformer } from 'typeorm';

const hasValue = (value: unknown): boolean => value !== null && value !== undefined;

export const jsonTransformer: ValueTransformer = {
  to: (value: unknown): string | null =>
    hasValue(value) ? JSON.stringify(value) : null,

  from: (value: unknown): unknown =>
    hasValue(value) ? JSON.parse(value as string) : null,
};
