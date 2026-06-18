import { Center, Divider, Loader, Stack, Text } from '@mantine/core';
import type { NotificationItem as NotifItem } from '../api';
import NotificationItem from './NotificationItem';

interface Props {
  notifications: NotifItem[];
  loading: boolean;
}

export default function NotificationList({ notifications, loading }: Props) {
  if (loading) {
    return (
      <Center py="xl">
        <Loader color="blue" />
      </Center>
    );
  }

  if (notifications.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">No notifications yet.</Text>
      </Center>
    );
  }

  return (
    <Stack gap={0}>
      {notifications.map((item) => (
        <div key={item.id}>
          <NotificationItem item={item} />
          <Divider />
        </div>
      ))}
    </Stack>
  );
}
