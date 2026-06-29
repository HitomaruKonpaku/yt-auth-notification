import { Center, Divider, Stack, Text } from '@mantine/core';
import { useData } from '../context/DataContext';
import NotificationItem from './NotificationItem';

export default function NotificationList() {
  const { notifications } = useData();

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
        <div key={item.id} data-id={item.id}>
          <NotificationItem item={item} />
          <Divider />
        </div>
      ))}
    </Stack>
  );
}
