import { YTNodes } from 'youtubei.js';

export function extractPageId(channel: YTNodes.AccountItem): string | undefined {
  const tokens = channel.endpoint?.payload?.supportedTokens;
  if (!Array.isArray(tokens)) {
    return undefined;
  }
  for (const token of tokens) {
    if (token?.pageIdToken?.pageId) {
      return String(token.pageIdToken.pageId);
    }
  }
  return undefined;
}
