const AUTHOR_VERB_DELIMITERS = [
  ' is live:',
  ' is live',
  ' uploaded:',
  ' uploaded',
  ' liked your comment:',
  ' liked your comment',
  ' replied:',
  ' replied',
  ' premiering now:',
  ' premiering now',
  ' premiering:',
  ' premiering',
  ' posted:',
  ' posted',
  ' pinned your comment',
];

const FROM_AT_PREFIX = ' from @';
const MEMBERS_ONLY_PREFIX = 'For members only from ';
const AUTHOR_NAME_FALLBACK_MAX_LENGTH = 50;
const LEADING_EMOJI_PATTERN = /^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B50}\u{2764}\u{FE0F}\u{200D}]+ ?/u;

export function parseAuthorName(text: string): string {
  let cleaned = text.replace(LEADING_EMOJI_PATTERN, '').trim();

  if (cleaned.startsWith(MEMBERS_ONLY_PREFIX)) {
    cleaned = cleaned.slice(MEMBERS_ONLY_PREFIX.length);
    const colonIdx = cleaned.indexOf(':');
    if (colonIdx !== -1) {
      return cleaned.slice(0, colonIdx).trim();
    }
    return cleaned.slice(0, AUTHOR_NAME_FALLBACK_MAX_LENGTH).trim();
  }

  // "Watch <name> live in <time>: ..." pattern
  if (cleaned.startsWith('Watch ') && cleaned.includes(' live in')) {
    const afterWatch = cleaned.slice(6);
    const liveIdx = afterWatch.indexOf(' live in');
    return afterWatch.slice(0, liveIdx).trim();
  }

  const fromAtIdx = cleaned.indexOf(FROM_AT_PREFIX);
  if (fromAtIdx !== -1) {
    const afterFrom = cleaned.slice(fromAtIdx + 6); // length of ' from '
    const match = afterFrom.match(/^@[\w.]+/);
    if (match) {
      return match[0];
    }
  }

  for (const delim of AUTHOR_VERB_DELIMITERS) {
    const idx = cleaned.indexOf(delim);
    if (idx !== -1) {
      return cleaned.slice(0, idx).trim();
    }
  }

  return cleaned.slice(0, AUTHOR_NAME_FALLBACK_MAX_LENGTH).trim();
}
