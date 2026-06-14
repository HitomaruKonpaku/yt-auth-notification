import type { ShortMessage } from '../db/db.interface';

export interface NotificationLike {
  id: string;
  sent_at: number;
  video_id?: string;
  linked_comment_id?: string;
  endpoint_url?: string;
  short_message: ShortMessage;
  thumbnail_url?: string;
}
