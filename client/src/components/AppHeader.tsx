import { ActionIcon, Avatar, Group, Indicator, Menu, Select, Switch, Text } from '@mantine/core';
import { IconBell, IconBellFilled, IconBellOff, IconHome, IconList } from '@tabler/icons-react';
import type { Account } from '../api';
import { useConfig } from '../context/ConfigContext';

interface Props {
  accounts: Account[];
  selectedChannelId: string | null;
  notifEnabled: boolean;
  newCount: number;
  notifLabel: string;
  onSelectChannel: (id: string | null) => void;
  onToggleNotif: () => void;
  onChangeLimit: (n: number) => void;
  onResetNewCount: () => void;
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
    accounts, selectedChannelId, notifEnabled, newCount, notifLabel,
    onSelectChannel, onToggleNotif, onChangeLimit, onResetNewCount,
  } = props;

  const { useAbsoluteTime, toggleAbsoluteTime, limit } = useConfig();
  const selected = selectedAccount(accounts, selectedChannelId);

  return (
    <Group h="100%" px={{ base: 'sm', sm: 'md' }} wrap="nowrap">
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

      <Menu shadow="md" width={260}>
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
        color={notifButtonColor(notifEnabled, notifLabel)}
        size="lg"
        onClick={onToggleNotif}
        title={notifEnabled ? 'notifs on' : notifLabel}
      >
        {notifIcon(notifEnabled, notifLabel)}
      </ActionIcon>

      <Switch
        checked={useAbsoluteTime}
        onChange={toggleAbsoluteTime}
        size="xs"
        aria-label="Toggle absolute time"
      />

      <Select
        data={['5', '10', '20', '50', '100']}
        value={String(limit)}
        onChange={(v) => onChangeLimit(Number(v))}
        size="xs"
        w={64}
        allowDeselect={false}
        withAlignedLabels
        styles={(t) => ({
          input: { fontFamily: t.fontFamilyMonospace },
          option: { fontFamily: t.fontFamilyMonospace },
        })}
      />

      <Indicator
        color="green"
        processing={newCount > 0}
        disabled={newCount === 0}
        offset={4}
        ml="auto"
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
  );
}
