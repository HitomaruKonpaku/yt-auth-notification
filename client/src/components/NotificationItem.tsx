import { Anchor, Avatar, Group, Image, Stack, Text } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import type { NotificationItem as NotifItem } from '../api';

interface Props {
  item: NotifItem;
}

export default function NotificationItem({ item }: Props) {
  const { hovered, ref } = useHover();

  const content = (
    <Group
      ref={ref}
      gap="sm"
      align="flex-start"
      py="sm"
      px="sm"
      wrap="nowrap"
      bg={hovered ? 'dark.4' : undefined}
      style={{ cursor: item._linkUrl ? 'pointer' : 'default' }}
    >
      <Avatar src={item.thumbnail_url} radius="md" size="lg" />
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm">{item.short_message.text}</Text>
        <Text size="xs" title={item._sentAbsolute}>
          {item._sentFormatted}
        </Text>
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

  if (item._linkUrl) {
    return (
      <Anchor href={item._linkUrl} target="_blank" rel="noopener" underline="never" c="inherit">
        {content}
      </Anchor>
    );
  }
  return <div>{content}</div>;
}
