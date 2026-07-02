import { ActionIcon, Avatar, Divider, Drawer, Group, Indicator, Menu, Text } from '@mantine/core';
import { IconBell, IconBellFilled, IconBellOff, IconHome, IconList, IconRefresh, IconSettings } from '@tabler/icons-react';
import { useCallback } from 'react';
import type { Account } from '../api';
import { useData } from '../context/DataContext';
import { usePermission } from '../context/PermissionContext';
import SettingsContent from './SettingsContent';

interface Props {
  settingsOpen: boolean;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
  onSelectChannel: (id: string | null) => void;
  onReload: () => void;
}

const getSelectedAccount = (accounts: Account[], id: string | null): Account | null =>
  accounts.find((a) => a.id === id) ?? null;

const getNotificationColor = (permission: NotificationPermission) => {
  if (permission === 'granted') return 'green';
  if (permission === 'denied') return 'red';
  return 'blue';
};

const getNotificationIcon = (permission: NotificationPermission) => {
  if (permission === 'granted') return <IconBellFilled size={18} />;
  if (permission === 'denied') return <IconBellOff size={18} />;
  return <IconBell size={18} />;
};

export default function AppHeader(props: Props) {
  const {
    settingsOpen,
    onSettingsOpen,
    onSettingsClose,
    onSelectChannel,
    onReload,
  } = props;

  const { notificationPermission, setNotificationPermission } = usePermission();
  const { accounts, selectedChannelId, newNotificationIds, resetNewNotificationIds } = useData();
  const newCount = newNotificationIds.size;

  const toggleNotif = useCallback(() => {
    if (!('Notification' in window)) return;
    if (notificationPermission === 'granted') return;
    if (notificationPermission === 'denied') return;
    Notification.requestPermission().then((p) => {
      setNotificationPermission(p);
    });
  }, [notificationPermission, setNotificationPermission]);

  const notificationLabel = (() => {
    if (!('Notification' in window)) return 'unsupported';
    if (notificationPermission === 'granted') return 'granted';
    if (notificationPermission === 'denied') return 'denied';
    return 'enable notifications?';
  })();

  const selected = getSelectedAccount(accounts, selectedChannelId);

  const onResetNewCount = useCallback(() => {
    resetNewNotificationIds();
  }, [resetNewNotificationIds]);

  return (
    <Group h="100%" gap="sm" px={{ base: 'sm', sm: 'md' }} wrap="nowrap">
      <ActionIcon
        component="a"
        href="/"
        variant="subtle"
        color="blue"
        size="lg"
        title="Home"
      >
        <IconHome size={22} />
      </ActionIcon>

      <Menu shadow="md" width={260} transitionProps={{ transition: 'fade-up' }}>
        <Menu.Target>
          <ActionIcon
            variant="outline"
            color="blue"
            size="lg"
          >
            {selected ? (
              <Avatar src={selected.thumbnail_url} size={22} />
            ) : (
              <IconList size={18} />
            )}
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            onClick={() => onSelectChannel(null)}
            bg={selectedChannelId === null ? 'blue' : undefined}
            leftSection={<IconList size={22} />}
          >
            <Text size="sm" ff="monospace">ALL</Text>
          </Menu.Item>
          {accounts.map((a) => (
            <Menu.Item
              key={a.id}
              onClick={() => onSelectChannel(a.id)}
              leftSection={<Avatar src={a.thumbnail_url} size={22} />}
              bg={selectedChannelId === a.id ? 'blue' : undefined}
            >
              <div>
                <Text size="xs" ff="monospace" fw={500}>{a.handle}</Text>
                <Text size="xs" ff="monospace">{a.name}</Text>
              </div>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      <ActionIcon
        variant="outline"
        color="blue"
        size="lg"
        onClick={onSettingsOpen}
        title="Settings (Ctrl+,)"
      >
        <IconSettings size={18} />
      </ActionIcon>

      <ActionIcon
        variant="outline"
        color={getNotificationColor(notificationPermission)}
        size="lg"
        onClick={toggleNotif}
        title={notificationLabel}
      >
        {getNotificationIcon(notificationPermission)}
      </ActionIcon>

      <Drawer
        opened={settingsOpen}
        onClose={onSettingsClose}
        title="Settings"
        size="xs"
      >
        <Divider mb="md" />
        <SettingsContent />
      </Drawer>

      <Group gap="sm" ml="auto" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="blue"
          size="lg"
          onClick={onReload}
          title="Reload (R)"
        >
          <IconRefresh size={18} />
        </ActionIcon>

        <Indicator
          processing
          disabled={newCount === 0}
          offset={4}
        >
          <ActionIcon
            variant="subtle"
            color="blue"
            size="lg"
            onClick={onResetNewCount}
            title="New notifications"
          >
            <IconBell size={18} />
          </ActionIcon>
        </Indicator>
      </Group>
    </Group>
  );
}
