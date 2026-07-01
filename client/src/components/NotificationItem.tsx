import { ActionIcon, Anchor, Avatar, Group, Image, Indicator, Menu, Stack, Text } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { IconClock, IconDotsVertical } from '@tabler/icons-react';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import type { NotificationItem as NotifItem } from '../api';
import { useConfig } from '../context/ConfigContext';
import { useData } from '../context/DataContext';

interface Props {
  item: NotifItem;
}

export default function NotificationItem({ item }: Props) {
  const { hovered, ref } = useHover();
  const { useAbsoluteTime, showOwnerProfile } = useConfig();
  const { accounts, newNotificationIds, dismissNewNotificationId } = useData();
  const isNew = newNotificationIds.has(item.id);
  const owner = item.owner_id ? accounts.find((a) => a.id === item.owner_id) : null;
  const [, setTick] = useState(0);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') setTick((t) => t + 1); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const timeDisplay = useAbsoluteTime
    ? DateTime.fromMillis(item.sent_at).toFormat('yyyy-MM-dd HH:mm:ss')
    : DateTime.fromMillis(item.sent_at).toRelative();

  const content = (
    <Group
      ref={ref}
      gap="sm"
      align="flex-start"
      py="sm"
      px="md"
      wrap="nowrap"
      bg={hovered ? 'dark.4' : undefined}
    >
      <Indicator
        processing
        position="middle-start"
        offset={-9}
        disabled={!isNew}
        size={11}
        withBorder
        zIndex={0}
      >
        <Avatar src={item.thumbnail_url} radius="md" size="lg" />
      </Indicator>
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" ta="justify">{item.short_message.text}</Text>
        <Group gap={6}>
          <IconClock size={16} />
          <Text size="xs" ff="monospace">{timeDisplay}</Text>
        </Group>
        {showOwnerProfile && owner && (
          <Group gap={6}>
            <Avatar src={owner.thumbnail_url} size={16} />
            <Text size="xs" ff="monospace">{owner.handle}</Text>
          </Group>
        )}
      </Stack>
      {item.video_id && (
        <Image
          src={`https://i.ytimg.com/vi/${item.video_id}/default.jpg`}
          w={96}
          h={48}
          radius="sm"
          fit="cover"
          referrerPolicy="no-referrer"
        />
      )}
      <Menu>
        <Menu.Target>
          <ActionIcon variant="subtle" size="lg" radius="lg" onClick={(e) => { e.preventDefault(); }}>
            <IconDotsVertical size={24} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={() => { navigator.clipboard.writeText(item.id); }}>
            Copy ID
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );

  if (item._url) {
    return (
      <Anchor
        href={item._url}
        target="_blank"
        rel="noopener"
        underline="never"
        c="inherit"
        onClick={() => dismissNewNotificationId(item.id)}
      >
        {content}
      </Anchor>
    );
  }
  return (
    <div onClick={() => dismissNewNotificationId(item.id)} style={{ cursor: 'pointer' }}>
      {content}
    </div>
  );
}
