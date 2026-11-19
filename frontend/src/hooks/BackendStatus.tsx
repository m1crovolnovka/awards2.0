import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { pingBackend } from '../api/client';

interface BackendState {
  online: boolean | null;
  checking: boolean;
  recheck: () => Promise<void>;
}

const Ctx = createContext<BackendState | null>(null);

export function BackendStatusProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const recheck = useCallback(async () => {
    setChecking(true);
    const ok = await pingBackend();
    setOnline(ok);
    setChecking(false);
  }, []);

  useEffect(() => {
    void recheck();
    const id = window.setInterval(() => void pingBackend().then(setOnline), 30000);
    return () => window.clearInterval(id);
  }, [recheck]);

  const value = useMemo(
    () => ({ online, checking, recheck }),
    [online, checking, recheck],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBackendStatus() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBackendStatus outside provider');
  return ctx;
}
