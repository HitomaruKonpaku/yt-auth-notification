import { useHotkeys } from '@mantine/hooks';
import { type ReactNode } from 'react';

export interface HotkeyActions {
  reload: () => void;
  prevPage: () => void;
  nextPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  toggleSettings: () => void;
}

export function HotkeyProvider({ actions, children }: {
  actions: HotkeyActions;
  children: ReactNode;
}) {
  const { reload, prevPage, nextPage, firstPage, lastPage, toggleSettings } = actions;

  useHotkeys([
    ['R', reload],
    ['A', prevPage],
    ['D', nextPage],
    ['Q', firstPage],
    ['E', lastPage],
    ['mod+,', toggleSettings],
  ]);

  return <>{children}</>;
}
