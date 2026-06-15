export interface YoutubeLinkParams {
  video_id?: string;
  linked_comment_id?: string;
  endpoint_url?: string;
}

export function buildYtVideoThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/default.jpg`;
}

export function buildYtEndpointUrl(opts: YoutubeLinkParams): string | null {
  if (opts.linked_comment_id && opts.video_id) {
    return `https://youtube.com/watch?v=${opts.video_id}&lc=${opts.linked_comment_id}`;
  }
  if (opts.endpoint_url) {
    const url = new URL(opts.endpoint_url, 'https://youtube.com');
    url.searchParams.delete('pp');
    return url.toString();
  }
  return null;
}
