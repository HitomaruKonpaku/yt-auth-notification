import { createContext, useContext, useState, type ReactNode } from 'react';

interface PermissionContextValue {
  notificationPermission: NotificationPermission;
  setNotificationPermission: (p: NotificationPermission) => void;
}

const PermissionContext = createContext<PermissionContextValue>({
  notificationPermission: 'default',
  setNotificationPermission: () => {},
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    'Notification' in window ? Notification.permission : 'denied'
  );

  return (
    <PermissionContext.Provider value={{ notificationPermission, setNotificationPermission }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}
