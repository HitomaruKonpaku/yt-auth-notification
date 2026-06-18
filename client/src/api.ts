export interface Account {
  id: string;
  handle: string;
  name: string;
  thumbnail_url: string | null;
}

export interface NotificationItem {
  id: string;
  created_at?: number;
  updated_at?: number;
  sent_at: number;
  owner_id: string | null;
  video_id: string | null;
  post_id: string | null;
  linked_comment_id?: string;
  endpoint_url?: string;
  short_message: { text: string; rtl?: boolean };
  thumbnail_url: string | null;
  _url: string | null;
  _sentRelative: string;
  _sentAbsolute: string;
}

export interface NotificationsResponse {
  total: number;
  items: NotificationItem[];
}

export interface AccountsResponse {
  total: number;
  items: Account[];
}

export async function fetchNotifications(params: {
  limit: number;
  offset: number;
  channelId?: string | null;
}): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.channelId) {
    searchParams.set('channel_id', params.channelId);
  }
  const res = await fetch(`/api/notifications?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAccounts(): Promise<AccountsResponse> {
  const res = await fetch('/api/accounts');
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}
