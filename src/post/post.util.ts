import { YTNodes } from 'youtubei.js';

export function isBackstagePost(node: { type: string }): node is YTNodes.BackstagePost {
  return node.type === 'BackstagePost';
}
