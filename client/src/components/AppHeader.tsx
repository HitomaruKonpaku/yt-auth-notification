import { ActionIcon, Avatar, Divider, Drawer, Group, Indicator, Menu, Text } from '@mantine/core';
import { IconBell, IconBellFilled, IconBellOff, IconHome, IconList, IconRefresh, IconSettings } from '@tabler/icons-react';
import { useCallback } from 'react';
import type { Account } from '../api';
import { useData } from '../context/DataContext';
import SettingsContent from './SettingsContent';

interface Props {
  notifEnabled: boolean;
  notifLabel: string;
  settingsOpen: boolean;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
  onSelectChannel: (id: string | null) => void;
  onToggleNotif: () => void;
  onReload: () => void;
}

const selectedAccount = (accounts: Account[], id: string | null): Account | null =>
  accounts.find((a) => a.id === id) ?? null;

const notifButtonColor = (enabled: boolean, label: string) => {
  if (enabled) return 'green';
  if (label === 'blocked') return 'red';
  return 'blue';
};

const notifIcon = (enabled: boolean, label: string) => {
  if (enabled) return <IconBellFilled size={18} />;
  if (label === 'blocked' || label === 'unsupported') return <IconBellOff size={18} />;
  return <IconBell size={18} />;
};

export default function AppHeader(props: Props) {
  const {
    notifEnabled, notifLabel,
    settingsOpen, onSettingsOpen, onSettingsClose,
    onSelectChannel, onToggleNotif, onReload,
  } = props;

  const { accounts, selectedChannelId, newNotificationIds, resetNewNotificationIds } = useData();
  const newCount = newNotificationIds.size;
  const selected = selectedAccount(accounts, selectedChannelId);

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
            <Text size="sm">ALL</Text>
          </Menu.Item>
          {accounts.map((a) => (
            <Menu.Item
              key={a.id}
              onClick={() => onSelectChannel(a.id)}
              leftSection={<Avatar src={a.thumbnail_url} size={22} />}
              bg={selectedChannelId === a.id ? 'blue' : undefined}
            >
              <div>
                <Text size="xs" fw={500}>{a.handle}</Text>
                <Text size="xs">{a.name}</Text>
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
        color={notifButtonColor(notifEnabled, notifLabel)}
        size="lg"
        onClick={onToggleNotif}
        title={notifEnabled ? 'notifs on' : notifLabel}
      >
        {notifIcon(notifEnabled, notifLabel)}
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
