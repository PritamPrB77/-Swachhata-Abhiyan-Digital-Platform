import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/api";
import { wsUrl } from "@/lib/utils";

export type SocketState = "connecting" | "connected" | "reconnecting" | "offline";

type Options = {
  onMessage?: (data: unknown) => void;
  enabled?: boolean;
  /** Max reconnect attempts before staying offline (0 = forever) */
  maxAttempts?: number;
};

export function useFleetSocket({ onMessage, enabled = true, maxAttempts = 0 }: Options) {
  const [state, setState] = useState<SocketState>("connecting");
  const [attempt, setAttempt] = useState(0);
  const [lastError, setLastError] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const stoppedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const connect = useCallback(() => {
    if (stoppedRef.current || !enabled) return;
    const token = getToken();
    if (!token) {
      setState("offline");
      setLastError("Not signed in — cannot open live socket");
      return;
    }

    clearTimer();
    setState(attemptRef.current === 0 ? "connecting" : "reconnecting");
    setAttempt(attemptRef.current);

    try {
      const ws = new WebSocket(`${wsUrl("/ws/fleet")}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        setAttempt(0);
        setState("connected");
        setLastError("");
      };

      ws.onmessage = (ev) => {
        try {
          onMessageRef.current?.(JSON.parse(ev.data));
        } catch {
          /* ignore malformed */
        }
      };

      ws.onerror = () => {
        setLastError("Socket error — will retry");
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (stoppedRef.current || !enabled) {
          setState("offline");
          return;
        }
        attemptRef.current += 1;
        setAttempt(attemptRef.current);
        if (maxAttempts > 0 && attemptRef.current > maxAttempts) {
          setState("offline");
          setLastError("Live socket offline — refresh or use REST snapshot");
          return;
        }
        const delay = Math.min(30_000, 1000 * 2 ** Math.min(attemptRef.current - 1, 4));
        setState("reconnecting");
        setLastError(`Reconnecting… (attempt ${attemptRef.current})`);
        timerRef.current = window.setTimeout(connect, delay);
      };
    } catch (e) {
      setState("offline");
      setLastError(e instanceof Error ? e.message : "Failed to open WebSocket");
    }
  }, [enabled, maxAttempts]);

  useEffect(() => {
    stoppedRef.current = false;
    if (enabled) connect();
    return () => {
      stoppedRef.current = true;
      clearTimer();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, enabled]);

  const send = useCallback((payload: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const reconnectNow = useCallback(() => {
    stoppedRef.current = false;
    clearTimer();
    wsRef.current?.close();
    attemptRef.current = 0;
    connect();
  }, [connect]);

  return { state, attempt, lastError, send, reconnectNow, socket: wsRef };
}

export function socketLabel(state: SocketState, attempt: number) {
  if (state === "connected") return "Connected";
  if (state === "reconnecting") return `Reconnecting (attempt ${attempt})`;
  if (state === "offline") return "Offline";
  return "Connecting…";
}

export function socketTone(state: SocketState) {
  if (state === "connected") return "text-emerald-600 dark:text-emerald-400 font-semibold";
  if (state === "reconnecting") return "text-amber-600 dark:text-amber-400 font-semibold";
  if (state === "offline") return "text-rose-600 dark:text-rose-400 font-semibold";
  return "text-sky-600 dark:text-sky-400 font-semibold";
}
