import { createContext, useContext, useState, type ReactNode } from 'react';

interface LoadingContextValue {
  loading: boolean;
  setLoading: (v: boolean) => void;
}

const LoadingContext = createContext<LoadingContextValue>({ loading: true, setLoading: () => {} });

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
