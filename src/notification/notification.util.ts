import { DateTime } from 'luxon';
import { buildYtEndpointUrl } from '../common/link-builder';

export interface Enrichable {
  sent_at: number;
  video_id?: string;
  post_id?: string;
  linked_comment_id?: string;
  endpoint_url?: string;
}

export function enrichNotification<T extends Enrichable>(item: T): T & {
  _url: string | null;
  _sentRelative: string | null;
  _sentAbsolute: string;
} {
  return {
    ...item,
    _url: buildYtEndpointUrl(item),
    _sentRelative: DateTime.fromMillis(item.sent_at).toRelative(),
    _sentAbsolute: DateTime.fromMillis(item.sent_at).toFormat('yyyy-MM-dd HH:mm:ss'),
  };
}
