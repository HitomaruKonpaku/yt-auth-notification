import { nanoid } from 'nanoid';

export class IdUtil {
  public static generate(size = 11): string {
    return nanoid(size);
  }
}
