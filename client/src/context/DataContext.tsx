import { createContext, useCallback, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { Account, NotificationItem } from '../api';

interface DataContextValue {
  accounts: Account[];
  notifications: NotificationItem[];
  newNotificationIds: Set<string>;
  selectedChannelId: string | null;
  setAccounts: Dispatch<SetStateAction<Account[]>>;
  setNotifications: Dispatch<SetStateAction<NotificationItem[]>>;
  setSelectedChannelId: Dispatch<SetStateAction<string | null>>;
  addNewNotificationId: (id: string) => void;
  dismissNewNotificationId: (id: string) => void;
  resetNewNotificationIds: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const fakeNotificationIds: string[] = [
]

export function DataProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set(fakeNotificationIds));
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const addNewNotificationId = useCallback((id: string) => {
    setNewNotificationIds((prev) => new Set(prev).add(id));
  }, []);

  const dismissNewNotificationId = useCallback((id: string) => {
    setNewNotificationIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const resetNewNotificationIds = useCallback(() => {
    setNewNotificationIds(new Set());
  }, []);

  return (
    <DataContext.Provider
      value={{
        accounts,
        notifications,
        newNotificationIds,
        selectedChannelId,
        setAccounts,
        setNotifications,
        setSelectedChannelId,
        addNewNotificationId,
        dismissNewNotificationId,
        resetNewNotificationIds,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within DataProvider');
  }
  return ctx;
}
