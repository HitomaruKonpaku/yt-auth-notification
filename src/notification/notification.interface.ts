export interface NotificationLike {
  id: string;
  created_at?: number;
  sent_at: number;
  owner_id?: string;
  video_id?: string;
  post_id?: string;
  linked_comment_id?: string;
  endpoint_url?: string;
  message: string;
  thumbnail_url?: string;
}

export interface RawNotification {
  notification_id: string;
  short_message?: {
    text?: string;
    rtl?: boolean;
  };
  thumbnails?: { url: string }[];
  endpoint?: {
    metadata?: { url?: string };
    payload?: {
      videoId?: string;
      linkedCommentId?: string;
      browseId?: string;
      params?: string;
    };
  };
}
