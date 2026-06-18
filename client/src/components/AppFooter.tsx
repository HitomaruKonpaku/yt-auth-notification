import { Group, Pagination, Text } from '@mantine/core';

interface Props {
  offset: number;
  limit: number;
  total: number;
  onGoTo: (offset: number) => void;
}

export default function AppFooter({ offset, limit, total, onGoTo }: Props) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const startItem = total === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, total);

  const goToPage = (p: number) => onGoTo((p - 1) * limit);

  return (
    <Group justify="center" h="100%" px={{ base: 'sm', sm: 'md' }}>
      <Pagination.Root
        total={totalPages}
        value={page}
        disabled={!total}
        onChange={goToPage}
      >
        <Group gap="xs">
          <Pagination.First />
          <Pagination.Previous />
          <Text size="sm" mx="xs" c="dimmed" style={{ minWidth: 100, textAlign: 'center' }}>
            {startItem}&ndash;{endItem} / {total}
          </Text>
          <Pagination.Next />
          <Pagination.Last />
        </Group>
      </Pagination.Root>
    </Group>
  );
}
