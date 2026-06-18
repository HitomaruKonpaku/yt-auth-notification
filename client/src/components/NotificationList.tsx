import { Center, Divider, Loader, Stack, Text } from '@mantine/core';
import type { NotificationItem as NotifItem } from '../api';
import { useLoading } from '../context/LoadingContext';
import NotificationItem from './NotificationItem';

interface Props {
  notifications: NotifItem[];
}

export default function NotificationList({ notifications }: Props) {
  const { loading } = useLoading();

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
