import { Indicator, type MantineThemeOverride } from '@mantine/core';

export const DISCORD_GREEN = '#57F287';

export const theme: MantineThemeOverride = {
  fontFamily: 'Roboto, sans-serif',
  fontFamilyMonospace: 'Roboto Mono, monospace',
  colors: {
    green: [
      '#d8f8e3', '#b0f1c7', '#89eaab', '#61e38f',
      '#3adc73', '#46c26c', DISCORD_GREEN, '#36a251',
      '#278236', '#17621b',
    ],
  },
  components: {
    Indicator: Indicator.extend({
      defaultProps: {
        color: DISCORD_GREEN,
      },
    }),
  },
};
