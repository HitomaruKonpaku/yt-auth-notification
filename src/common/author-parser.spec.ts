import { parseAuthorName } from './author-parser';

describe('parseAuthorName', () => {
  // emoji strip (first code path)
  it('should strip leading reaction emoji before " liked"', () => {
    expect(parseAuthorName('👍 Someone liked your comment: "😂😂😂"'))
      .toBe('Someone');
  });

  it('should strip emoji and extract @handle before " replied"', () => {
    expect(parseAuthorName('🌟 @Linsaloty replied: "Test"'))
      .toBe('@Linsaloty');
  });

  // MEMBERS_ONLY_PREFIX
  it('should extract from "For members only from ..." pattern', () => {
    expect(parseAuthorName('For members only from 花芽すみれ / Kaga Sumire: "ツイキャスアーカイブPW..."'))
      .toBe('花芽すみれ / Kaga Sumire');
  });

  // "Watch ... live in ..." pattern
  it('should extract name from "Watch ... live in ..." pattern', () => {
    expect(parseAuthorName(
      'Watch Nakiri Ayame Ch. 百鬼あやめ live in 30 minutes: 【ブレインスリープ】視聴者アンケート紹介！余とすやすやし余？✨【百鬼あやめ/ホロライブ】'
    )).toBe('Nakiri Ayame Ch. 百鬼あやめ');
  });

  // gift membership prefix
  it('should extract name from gift membership pattern', () => {
    expect(parseAuthorName(
      'You got a gift membership: Enjoy 1-month access to Nakiri Ayame Ch. 百鬼あやめ perks starting now'
    )).toBe('Nakiri Ayame Ch. 百鬼あやめ');
  });

  // FROM_AT_PREFIX
  it('should extract @handle from "got a ❤ from @handle" pattern', () => {
    expect(parseAuthorName('Your comment got a ❤ from @tsuna_nekota!'))
      .toBe('@tsuna_nekota');
  });

  // AUTHOR_VERB_DELIMITERS (ordered by array)
  it('should extract name before " uploaded:"', () => {
    expect(parseAuthorName('Otaku-kun subs uploaded: 【ENG SUB】All I need'))
      .toBe('Otaku-kun subs');
  });

  it('should extract name before " premiering in"', () => {
    expect(parseAuthorName(
      'hololive ホロライブ - VTuber Group premiering in 30 minutes: [New Voice Pack & Merch] Reaffirming My Feelings'
    )).toBe('hololive ホロライブ - VTuber Group');
  });

  it('should extract name before " premiering"', () => {
    expect(parseAuthorName('Laplus ch. ラプラス premiering now: 【MV】Dirty Look'))
      .toBe('Laplus ch. ラプラス');
  });

  it('should extract name before " is live:"', () => {
    expect(parseAuthorName('Rica Ch. / 花宮莉歌 is live: 【実写カメラ】'))
      .toBe('Rica Ch. / 花宮莉歌');
  });

  it('should handle name before " replied"', () => {
    expect(parseAuthorName('SomeUser replied: Thanks!'))
      .toBe('SomeUser');
  });

  it('should extract @handle from "@handle pinned your comment" pattern', () => {
    expect(parseAuthorName('@Linsaloty pinned your comment.'))
      .toBe('@Linsaloty');
  });

  // fallback
  it('should fallback to first 50 chars if no delimiter found', () => {
    const long = 'A'.repeat(100) + ' no known delimiter here';
    expect(parseAuthorName(long)).toBe('A'.repeat(50));
  });
});
