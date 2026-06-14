import { parseAuthorName } from './author-parser';

describe('parseAuthorName', () => {
  it('should strip leading reaction emoji before " liked"', () => {
    expect(parseAuthorName('👍 Someone liked your comment: "😂😂😂"'))
      .toBe('Someone');
  });

  it('should handle name before " replied"', () => {
    expect(parseAuthorName('SomeUser replied: Thanks!'))
      .toBe('SomeUser');
  });

  it('should extract name before " is live:"', () => {
    expect(parseAuthorName('Rica Ch. / 花宮莉歌 is live: 【実写カメラ】'))
      .toBe('Rica Ch. / 花宮莉歌');
  });

  it('should extract name before " uploaded:"', () => {
    expect(parseAuthorName('Otaku-kun subs uploaded: 【ENG SUB】All I need'))
      .toBe('Otaku-kun subs');
  });

  it('should extract name before " premiering"', () => {
    expect(parseAuthorName('Laplus ch. ラプラス premiering now: 【MV】Dirty Look'))
      .toBe('Laplus ch. ラプラス');
  });

  it('should extract from "For members only from ..." pattern', () => {
    expect(parseAuthorName('For members only from 花芽すみれ / Kaga Sumire: "ツイキャスアーカイブPW..."'))
      .toBe('花芽すみれ / Kaga Sumire');
  });

  it('should fallback to first 50 chars if no delimiter found', () => {
    const long = 'A'.repeat(100) + ' no known delimiter here';
    expect(parseAuthorName(long)).toBe('A'.repeat(50));
  });
});
