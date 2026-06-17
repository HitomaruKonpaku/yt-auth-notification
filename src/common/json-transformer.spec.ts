import { jsonTransformer } from './json-transformer';

describe('jsonTransformer', () => {
  describe('to', () => {
    it('should JSON.stringify an object', () => {
      const result = jsonTransformer.to({ a: 1, b: 'text' });
      expect(result).toBe('{"a":1,"b":"text"}');
    });

    it('should return null for null', () => {
      expect(jsonTransformer.to(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(jsonTransformer.to(undefined)).toBeNull();
    });

    it('should JSON.stringify a string', () => {
      expect(jsonTransformer.to('hello')).toBe('"hello"');
    });

    it('should JSON.stringify a number', () => {
      expect(jsonTransformer.to(42)).toBe('42');
    });
  });

  describe('from', () => {
    it('should JSON.parse a string back to object', () => {
      const result = jsonTransformer.from('{"a":1,"b":"text"}');
      expect(result).toEqual({ a: 1, b: 'text' });
    });

    it('should return null for null', () => {
      expect(jsonTransformer.from(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(jsonTransformer.from(undefined)).toBeNull();
    });

    it('should JSON.parse a number string', () => {
      expect(jsonTransformer.from('42')).toBe(42);
    });
  });
});
