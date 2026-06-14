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
];

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

  for (const delim of AUTHOR_VERB_DELIMITERS) {
    const idx = cleaned.indexOf(delim);
    if (idx !== -1) {
      return cleaned.slice(0, idx).trim();
    }
  }

  return cleaned.slice(0, AUTHOR_NAME_FALLBACK_MAX_LENGTH).trim();
}
