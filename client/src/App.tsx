import { AppShell, Container, MantineProvider } from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type Account,
  type NotificationItem,
  fetchAccounts,
  fetchNotifications,
} from './api';
import AppFooter from './components/AppFooter';
import AppHeader from './components/AppHeader';
import NotificationList from './components/NotificationList';

const DEFAULT_LIMIT = 20;

function readUrl(): { channelId: string | null; limit: number; offset: number } {
  const params = new URLSearchParams(location.search);
  const storedLimit = Number(localStorage.getItem('limit')) || DEFAULT_LIMIT;
  return {
    channelId: params.get('channel_id') || null,
    limit: Number(params.get('limit')) || storedLimit || DEFAULT_LIMIT,
    offset: Number(params.get('offset')) || 0,
  };
}

function writeUrl(channelId: string | null, limit: number, offset: number) {
  const params = new URLSearchParams();
  if (channelId) params.set('channel_id', channelId);
  if (limit !== DEFAULT_LIMIT) params.set('limit', String(limit));
  if (offset !== 0) params.set('offset', String(offset));
  const qs = params.toString();
  history.pushState(null, '', qs ? `/?${qs}` : '/');
}

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [newCount, setNewCount] = useState(0);

  // Refs for SSE handler — avoids stale closure in the mount-time EventSource callback
  const channelRef = useRef<string | null>(null);
  const notifEnabledRef = useRef(false);
  const offsetRef = useRef(0);
  const seenIds = useRef(new Set<string>());

  // Sync refs each render so SSE handler always sees latest values
  channelRef.current = selectedChannelId;
  notifEnabledRef.current = notifEnabled;
  offsetRef.current = offset;

  const loadNotifications = useCallback(async (chanId: string | null, lim: number, off: number) => {
    setLoading(true);
    try {
      const data = await fetchNotifications({ limit: lim, offset: off, channelId: chanId });
      setNotifications(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('fetchNotifications failed:', err);
      setNotifications([]);
    }
    setLoading(false);
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetchAccounts();
      setAccounts(data.items);
    } catch (err) {
      console.error('fetchAccounts failed:', err);
    }
  }, []);

  // Init: read URL, fetch data, start SSE
  useEffect(() => {
    const { channelId, limit: urlLimit, offset: urlOffset } = readUrl();
    setSelectedChannelId(channelId);
    setLimit(urlLimit);
    setOffset(urlOffset);

    loadAccounts();
    loadNotifications(channelId, urlLimit, urlOffset);

    if ('Notification' in window && Notification.permission === 'granted') {
      setNotifEnabled(true);
    }

    const handleAccountList = (data: any) => {
      if (data?.items) {
        setAccounts(data.items);
      }
    };

    const handleNotificationNew = (data: any) => {
      if (!data?.item) return;
      const item = data.item as NotificationItem;

      if (channelRef.current && item.owner_id !== channelRef.current) return;
      if (seenIds.current.has(item.id)) return;
      seenIds.current.add(item.id);

      setNewCount((prev) => prev + 1);

      if (notifEnabledRef.current) {
        new Notification(item.short_message.text, {
          icon: item.thumbnail_url || undefined,
          body: item.short_message.text,
        });
        new Audio('/se_chat_announce.ogg').play().catch((err) => {
          console.error('Audio playback failed:', err);
        });
      }

      if (offsetRef.current === 0) {
        setNotifications((prev) => [item, ...prev]);
      }
      setTotal((prev) => prev + 1);
    };

    const handlers: Record<string, (data: any) => void> = {
      'account.list': handleAccountList,
      'notification.new': handleNotificationNew,
    };

    const es = new EventSource('/sse');
    es.onmessage = (event) => {
      if (event.data === 'ping') return;
      try {
        const msg = JSON.parse(event.data);
        handlers[msg?.type]?.(msg.data);
      } catch {
        // ignore malformed events
      }
    };

    const onPopState = () => {
      const { channelId: ch, limit: l, offset: o } = readUrl();
      setSelectedChannelId(ch);
      setLimit(l);
      setOffset(o);
      setNewCount(0);
      loadNotifications(ch, l, o);
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      es.close();
      window.removeEventListener('popstate', onPopState);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectChannel = useCallback((channelId: string | null) => {
    setSelectedChannelId(channelId);
    setOffset(0);
    setNewCount(0);
    writeUrl(channelId, limit, 0);
    loadNotifications(channelId, limit, 0);
  }, [limit, loadNotifications]);

  const goTo = useCallback((newOffset: number) => {
    setNewCount(0);
    setOffset(newOffset);
    writeUrl(selectedChannelId, limit, newOffset);
    loadNotifications(selectedChannelId, limit, newOffset);
  }, [selectedChannelId, limit, loadNotifications]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setOffset(0);
    localStorage.setItem('limit', String(newLimit));
    writeUrl(selectedChannelId, newLimit, 0);
    loadNotifications(selectedChannelId, newLimit, 0);
  }, [selectedChannelId, loadNotifications]);

  const toggleNotif = useCallback(() => {
    if (!('Notification' in window)) return;
    if (notifEnabled) return; // once enabled, stays enabled
    if (Notification.permission === 'denied') return;
    Notification.requestPermission().then((p) => {
      setNotifEnabled(p === 'granted');
    });
  }, [notifEnabled]);

  const resetNewCount = useCallback(() => {
    setNewCount(0);
    goTo(0);
  }, [goTo]);

  const notifLabel = (() => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'denied') return 'blocked';
    return 'enable notifs';
  })();

  return (
    <MantineProvider defaultColorScheme="dark">
      <AppShell
        header={{ height: 50 }}
        footer={{ height: 50 }}
      >
        <AppShell.Header>
          <Container maw={800} h="100%" px={{ base: 0, sm: 'md' }}>
            <AppHeader
              accounts={accounts}
              selectedChannelId={selectedChannelId}
              limit={limit}
              notifEnabled={notifEnabled}
              newCount={newCount}
              notifLabel={notifLabel}
              onSelectChannel={selectChannel}
              onToggleNotif={toggleNotif}
              onChangeLimit={changeLimit}
              onResetNewCount={resetNewCount}
            />
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          <Container maw={800} px={{ base: 0, sm: 'md' }}>
            <NotificationList
              notifications={notifications}
              loading={loading}
            />
          </Container>
        </AppShell.Main>

        <AppShell.Footer>
          <Container maw={800} h="100%" px={{ base: 0, sm: 'md' }}>
            <AppFooter
              offset={offset}
              limit={limit}
              total={total}
              onGoTo={goTo}
            />
          </Container>
        </AppShell.Footer>
      </AppShell>
    </MantineProvider>
  );
}
