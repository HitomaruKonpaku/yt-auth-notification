import { extractHandle, extractPageId } from './channel.util';

describe('extractHandle', () => {
  it('should extract @handle from channel URL', () => {
    expect(extractHandle('https://www.youtube.com/@NakiriAyame')).toBe('@NakiriAyame');
  });

  it('should extract @handle from /featured URL', () => {
    expect(extractHandle('https://www.youtube.com/@NakiriAyame/featured')).toBe('@NakiriAyame');
  });

  it('should extract @handle from /videos URL', () => {
    expect(extractHandle('https://www.youtube.com/@NakiriAyame/videos')).toBe('@NakiriAyame');
  });

  it('should return undefined for non-channel URL', () => {
    expect(extractHandle('https://www.youtube.com/watch?v=abc')).toBeUndefined();
  });

  it('should decode URL-encoded handle', () => {
    expect(extractHandle('http://www.youtube.com/@%E5%85%AB%E9%9B%B2%E3%81%B9%E3%81%AB')).toBe('@八雲べに');
  });

  it('should return undefined for undefined input', () => {
    expect(extractHandle(undefined)).toBeUndefined();
  });
});

describe('extractPageId', () => {
  function makeAccountItem(supportedTokens?: any[]): any {
    return {
      endpoint: { payload: { supportedTokens } },
    };
  }

  it('should extract pageId from supportedTokens', () => {
    const channel = makeAccountItem([{ pageIdToken: { pageId: 'abc123' } }]);
    expect(extractPageId(channel)).toBe('abc123');
  });

  it('should return undefined for undefined tokens', () => {
    const channel = makeAccountItem(undefined);
    expect(extractPageId(channel)).toBeUndefined();
  });

  it('should return undefined for non-array tokens', () => {
    const channel = makeAccountItem('not-array' as any);
    expect(extractPageId(channel)).toBeUndefined();
  });

  it('should return undefined for empty tokens', () => {
    const channel = makeAccountItem([]);
    expect(extractPageId(channel)).toBeUndefined();
  });

  it('should return undefined for token without pageIdToken', () => {
    const channel = makeAccountItem([{ otherToken: {} }]);
    expect(extractPageId(channel)).toBeUndefined();
  });
});
