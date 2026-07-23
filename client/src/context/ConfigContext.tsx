import { createContext, useContext, useState, type ReactNode } from 'react';

interface Config {
  limit: number;
  useSound: boolean;
  useAbsoluteTime: boolean;
  showOwnerProfile: boolean;
}

interface ConfigContextValue {
  limit: number;
  setLimit: (n: number) => void;
  useSound: boolean;
  toggleSound: () => void;
  useAbsoluteTime: boolean;
  toggleAbsoluteTime: () => void;
  showOwnerProfile: boolean;
  toggleOwnerProfile: () => void;
}

const DEFAULT_LIMIT = 10;

const ConfigContext = createContext<ConfigContextValue>({
  limit: DEFAULT_LIMIT,
  setLimit: () => { },
  useSound: true,
  toggleSound: () => { },
  useAbsoluteTime: false,
  toggleAbsoluteTime: () => { },
  showOwnerProfile: false,
  toggleOwnerProfile: () => { },
});

export function readConfig(): Config {
  try {
    const stored = JSON.parse(localStorage.getItem('config') ?? '{}');
    return {
      limit: Number(stored.limit) || DEFAULT_LIMIT,
      useSound: stored.useSound !== false,
      useAbsoluteTime: stored.useAbsoluteTime === true,
      showOwnerProfile: stored.showOwnerProfile === true,
    };
  } catch {
    return {
      limit: DEFAULT_LIMIT,
      useSound: true,
      useAbsoluteTime: false,
      showOwnerProfile: false,
    };
  }
}

function writeConfig(partial: Partial<Config>) {
  const prev = readConfig();
  localStorage.setItem('config', JSON.stringify({ ...prev, ...partial }));
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(readConfig);

  const setLimit = (n: number) => {
    setConfig((prev) => {
      const next = { ...prev, limit: n };
      writeConfig({ limit: n });
      return next;
    });
  };

  const toggleSound = () => {
    setConfig((prev) => {
      const next = { ...prev, useSound: !prev.useSound };
      writeConfig({ useSound: next.useSound });
      return next;
    });
  };

  const toggleAbsoluteTime = () => {
    setConfig((prev) => {
      const next = { ...prev, useAbsoluteTime: !prev.useAbsoluteTime };
      writeConfig({ useAbsoluteTime: next.useAbsoluteTime });
      return next;
    });
  };

  const toggleOwnerProfile = () => {
    setConfig((prev) => {
      const next = { ...prev, showOwnerProfile: !prev.showOwnerProfile };
      writeConfig({ showOwnerProfile: next.showOwnerProfile });
      return next;
    });
  };

  return (
    <ConfigContext.Provider value={{
      limit: config.limit,
      setLimit,
      useSound: config.useSound,
      toggleSound,
      useAbsoluteTime: config.useAbsoluteTime,
      toggleAbsoluteTime,
      showOwnerProfile: config.showOwnerProfile,
      toggleOwnerProfile,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
