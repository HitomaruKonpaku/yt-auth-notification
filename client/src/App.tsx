import { AppShell, Container, MantineProvider, Progress } from '@mantine/core';
import { notifications, Notifications } from '@mantine/notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAccounts,
  fetchNotifications,
  fetchSessionStatus,
  type NotificationItem,
} from './api';
import AppFooter from './components/AppFooter';
import AppHeader from './components/AppHeader';
import NotificationList from './components/NotificationList';
import { readConfig, useConfig } from './context/ConfigContext';
import { useData } from './context/DataContext';
import { HotkeyProvider, type HotkeyActions } from './context/HotkeyContext';
import { useLoading } from './context/LoadingContext';
import { setErrorHandler } from './error';
import { calcLastPageOffset } from './paging';
import { theme } from './theme';

const DEFAULT_LIMIT = 10;

function readUrl(): { channelId: string | null; limit: number; offset: number } {
  const params = new URLSearchParams(location.search);
  const storedLimit = readConfig().limit;
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
  const { limit, setLimit } = useConfig();
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const { loading, setLoading } = useLoading();
  const {
    selectedChannelId, setSelectedChannelId,
    setAccounts, setNotifications,
    addNewNotificationId,
  } = useData();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [permission, setPermission] = useState(() =>
    'Notification' in window ? Notification.permission : 'denied'
  );
  // Refs for SSE handler — avoids stale closure in the mount-time EventSource callback
  const channelRef = useRef<string | null>(null);
  const notifEnabledRef = useRef(false);
  const offsetRef = useRef(0);
  const sessionExpiredNotifRef = useRef<string | null>(null);
  const prevLimitRef = useRef<number | null>(null);

  // Sync refs each render so SSE handler always sees latest values
  channelRef.current = selectedChannelId;
  notifEnabledRef.current = notifEnabled;
  offsetRef.current = offset;

  // Wire error notification bus — mount once
  useEffect(() => {
    const seen = new Map<string, string>();
    setErrorHandler((key, title, message) => {
      const existing = seen.get(key);
      if (existing) {
        notifications.hide(existing);
      }
      const id = notifications.show({
        title,
        message,
        color: 'red',
        autoClose: 5000,
        position: 'top-right',
      });
      seen.set(key, id);
    });
    return () => setErrorHandler(() => { });
  }, []);

  const loadNotifications = useCallback(async (chanId: string | null, lim: number, off: number) => {
    setLoading(true);
    try {
      const data = await fetchNotifications({ limit: lim, offset: off, channelId: chanId });
      setNotifications(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('fetchNotifications failed:', err);
    }
    setLoading(false);
  }, [setLoading, setNotifications]);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetchAccounts();
      setAccounts(data.items);
    } catch (err) {
      console.error('fetchAccounts failed:', err);
    }
  }, [setAccounts]);

  // Init: read URL, fetch data, start SSE
  useEffect(() => {
    const { channelId, limit: urlLimit, offset: urlOffset } = readUrl();
    setSelectedChannelId(channelId);
    setLimit(urlLimit);
    setOffset(urlOffset);

    loadAccounts();
    loadNotifications(channelId, urlLimit, urlOffset);

    const showSessionExpired = () => {
      if (!sessionExpiredNotifRef.current) {
        sessionExpiredNotifRef.current = notifications.show({
          title: 'Session Expired',
          message: 'Cookie has expired — please update cookies.txt',
          color: 'red',
          autoClose: false,
          position: 'top-right',
        });
      }
    };

    fetchSessionStatus().then((status) => {
      if (status.expired) {
        showSessionExpired();
      }
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      setPermission('granted');
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

      addNewNotificationId(item.id);

      if (notifEnabledRef.current) {
        const notif = new Notification(item.short_message.text, {
          icon: item.thumbnail_url || undefined,
          body: item.short_message.text,
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
          setOffset(0);
          writeUrl(channelRef.current, limit, 0);
          loadNotifications(channelRef.current, limit, 0);
        };
        const audio = new Audio('/se_chat_announce.ogg');
        audio.onerror = () => console.error('Audio failed to load or decode');
        audio.play().catch((err) => {
          console.error('Audio playback failed:', err);
        });
      }

      if (offsetRef.current === 0) {
        setNotifications((prev) => [item, ...prev]);
      }
      setTotal((prev) => prev + 1);
    };

    const handleSessionExpired = () => { showSessionExpired(); };

    const handlers: Record<string, (data: any) => void> = {
      'account.list': handleAccountList,
      'notification.new': handleNotificationNew,
      'session.expired': handleSessionExpired,
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
      loadNotifications(ch, l, o);
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      es.close();
      window.removeEventListener('popstate', onPopState);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // React to limit changes from SettingsContent (skip initial mount + init-time setLimit)
  useEffect(() => {
    if (prevLimitRef.current === null) {
      prevLimitRef.current = limit;
      return;
    }
    if (prevLimitRef.current === limit) return;
    prevLimitRef.current = limit;
    setOffset(0);
    writeUrl(selectedChannelId, limit, 0);
    loadNotifications(selectedChannelId, limit, 0);
  }, [limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectChannel = useCallback((channelId: string | null) => {
    setSelectedChannelId(channelId);
    setOffset(0);
    writeUrl(channelId, limit, 0);
    loadNotifications(channelId, limit, 0);
  }, [limit, loadNotifications]);

  const goTo = useCallback((newOffset: number) => {
    setOffset(newOffset);
    writeUrl(selectedChannelId, limit, newOffset);
    loadNotifications(selectedChannelId, limit, newOffset);
  }, [selectedChannelId, limit, loadNotifications]);

  const reload = useCallback(() => {
    loadNotifications(selectedChannelId, limit, offset);
  }, [selectedChannelId, limit, offset, loadNotifications]);

  const hotkeyActions: HotkeyActions = {
    reload,
    prevPage: () => goTo(Math.max(offset - limit, 0)),
    nextPage: () => goTo(Math.min(offset + limit, calcLastPageOffset(total ?? 0, limit))),
    firstPage: () => goTo(0),
    lastPage: () => goTo(calcLastPageOffset(total, limit)),
    toggleSettings: () => setSettingsOpen((prev) => !prev),
  };

  const toggleNotif = useCallback(() => {
    if (!('Notification' in window)) return;
    if (notifEnabled) return; // once enabled, stays enabled
    if (permission === 'denied') return;
    Notification.requestPermission().then((p) => {
      setPermission(p);
      setNotifEnabled(p === 'granted');
    });
  }, [notifEnabled]);

  const notifLabel = (() => {
    if (!('Notification' in window)) return 'unsupported';
    if (permission === 'denied') return 'blocked';
    return 'enable notifs';
  })();

  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <Notifications position="top-right" />
      <HotkeyProvider actions={hotkeyActions}>
        <AppShell
          header={{ height: 50 }}
          footer={{ height: 50 }}
        >
          <AppShell.Header>
            <Container maw={800} h="100%" px={{ base: 0, sm: 'md' }}>
              <AppHeader
                notifEnabled={notifEnabled}
                notifLabel={notifLabel}
                settingsOpen={settingsOpen}
                onSettingsOpen={() => setSettingsOpen(true)}
                onSettingsClose={() => setSettingsOpen(false)}
                onSelectChannel={selectChannel}
                onToggleNotif={toggleNotif}
                onReload={reload}
              />
            </Container>
          </AppShell.Header>

          {loading && (
            <Progress
              value={100}
              animated
              size="xs"
              style={{ position: 'fixed', top: 50, left: 0, right: 0, zIndex: 200 }}
            />
          )}

          <AppShell.Main>
            <Container maw={800} px={{ base: 0, sm: 'md' }}>
              <NotificationList />
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
      </HotkeyProvider>
    </MantineProvider>
  );
}
