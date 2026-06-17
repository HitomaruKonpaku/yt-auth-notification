export interface ShortMessage {
  text: string;
  rtl: boolean;
}

export interface NotificationLike {
  id: string;
  created_at?: number;
  sent_at: number;
  owner_id?: string;
  video_id?: string;
  post_id?: string;
  linked_comment_id?: string;
  endpoint_url?: string;
  short_message: ShortMessage;
  thumbnail_url?: string;
}
