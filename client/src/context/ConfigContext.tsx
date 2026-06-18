import { createContext, useContext, useState, type ReactNode } from 'react';

interface ConfigContextValue {
  useAbsoluteTime: boolean;
  toggleAbsoluteTime: () => void;
}

const ConfigContext = createContext<ConfigContextValue>({
  useAbsoluteTime: false,
  toggleAbsoluteTime: () => {},
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [useAbsoluteTime, setShowAbsoluteTime] = useState(() =>
    localStorage.getItem('useAbsoluteTime') === 'true'
  );

  const toggleAbsoluteTime = () => {
    setShowAbsoluteTime((prev) => {
      const next = !prev;
      localStorage.setItem('useAbsoluteTime', String(next));
      return next;
    });
  };

  return (
    <ConfigContext.Provider value={{ useAbsoluteTime, toggleAbsoluteTime }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
