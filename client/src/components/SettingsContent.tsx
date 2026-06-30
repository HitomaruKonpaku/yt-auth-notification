import { Code, Group, Select, Stack, Switch, Text, useMatches } from '@mantine/core';
import { useConfig } from '../context/ConfigContext';

export default function SettingsContent() {
  const {
    limit, setLimit,
    useAbsoluteTime, toggleAbsoluteTime,
    showOwnerProfile, toggleOwnerProfile,
  } = useConfig();

  const size = useMatches({ base: 'md', xs: 'sm' });

  return (
    <Stack gap="sm">
      <Group wrap="nowrap" justify="space-between">
        <Text size="sm">Limit</Text>
        <Select
          data={['5', '10', '20', '50']}
          value={String(limit)}
          size={size}
          maw={80}
          allowDeselect={false}
          withAlignedLabels
          onChange={(v) => setLimit(Number(v))}
        />
      </Group>

      <Group wrap="nowrap" justify="space-between">
        <Text size="sm">Use absolute time</Text>
        <Switch
          checked={useAbsoluteTime}
          size={size}
          onChange={toggleAbsoluteTime}
        />
      </Group>

      <Group wrap="nowrap" justify="space-between">
        <Text size="sm">Show owner profile</Text>
        <Switch
          checked={showOwnerProfile}
          size={size}
          onChange={toggleOwnerProfile}
        />
      </Group>

      <Group wrap="nowrap" justify="space-between">
        <Text size="sm">Version</Text>
        <Code>{window.__VERSION__ || 'dev'}</Code>
      </Group>
    </Stack>
  );
}
