import { createContext, useContext, useState, type ReactNode } from 'react';

interface Config {
  useAbsoluteTime: boolean;
  limit: number;
}

interface ConfigContextValue {
  useAbsoluteTime: boolean;
  toggleAbsoluteTime: () => void;
  limit: number;
  setLimit: (n: number) => void;
}

const DEFAULT_LIMIT = 10;

const ConfigContext = createContext<ConfigContextValue>({
  useAbsoluteTime: false,
  toggleAbsoluteTime: () => { },
  limit: DEFAULT_LIMIT,
  setLimit: () => { },
});

export function readConfig(): Config {
  try {
    const stored = JSON.parse(localStorage.getItem('config') ?? '{}');
    return {
      useAbsoluteTime: stored.useAbsoluteTime === true,
      limit: Number(stored.limit) || DEFAULT_LIMIT,
    };
  } catch {
    return {
      useAbsoluteTime: false,
      limit: DEFAULT_LIMIT,
    };
  }
}

function writeConfig(partial: Partial<Config>) {
  const prev = readConfig();
  localStorage.setItem('config', JSON.stringify({ ...prev, ...partial }));
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(readConfig);

  const toggleAbsoluteTime = () => {
    setConfig((prev) => {
      const next = { ...prev, useAbsoluteTime: !prev.useAbsoluteTime };
      writeConfig({ useAbsoluteTime: next.useAbsoluteTime });
      return next;
    });
  };

  const setLimit = (n: number) => {
    setConfig((prev) => {
      const next = { ...prev, limit: n };
      writeConfig({ limit: n });
      return next;
    });
  };

  return (
    <ConfigContext.Provider value={{
      useAbsoluteTime: config.useAbsoluteTime,
      toggleAbsoluteTime,
      limit: config.limit,
      setLimit,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
