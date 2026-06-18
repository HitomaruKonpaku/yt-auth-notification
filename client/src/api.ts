export interface Account {
  id: string;
  handle: string;
  name: string;
  thumbnail_url: string | null;
}

export interface NotificationItem {
  id: string;
  short_message: { text: string; rtl?: boolean };
  thumbnail_url: string | null;
  video_id: string | null;
  _linkUrl: string | null;
  _sentFormatted: string;
  _sentAbsolute: string;
  owner_id: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
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
