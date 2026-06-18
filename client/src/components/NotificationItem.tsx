import { DateTime } from 'luxon';
import { Anchor, Avatar, Group, Image, Stack, Text } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import type { NotificationItem as NotifItem } from '../api';
import { useConfig } from '../context/ConfigContext';

interface Props {
  item: NotifItem;
}

export default function NotificationItem({ item }: Props) {
  const { hovered, ref } = useHover();
  const { useAbsoluteTime } = useConfig();

  const timeDisplay = useAbsoluteTime
    ? DateTime.fromMillis(item.sent_at).toFormat('yyyy-MM-dd HH:mm:ss')
    : DateTime.fromMillis(item.sent_at).toRelative();

  const content = (
    <Group
      ref={ref}
      gap="sm"
      align="flex-start"
      py="sm"
      px="sm"
      wrap="nowrap"
      bg={hovered ? 'dark.4' : undefined}
      style={{ cursor: item._url ? 'pointer' : 'default' }}
    >
      <Avatar src={item.thumbnail_url} radius="md" size="lg" />
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" ta="justify">{item.short_message.text}</Text>
        <Text size="xs" ff="monospace">{timeDisplay}</Text>
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
    </Group>
  );

  if (item._url) {
    return (
      <Anchor href={item._url} target="_blank" rel="noopener" underline="never" c="inherit">
        {content}
      </Anchor>
    );
  }
  return <div>{content}</div>;
}
