import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseNumberPipe implements PipeTransform {
  constructor(private readonly defaultValue: number) { }

  transform(value: unknown): number {
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : this.defaultValue;
  }
}
