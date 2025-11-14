"use client";
import { useEffect, useRef, useState } from "react";

type WorkerEvent = {
  event: string;
  resume_id?: string;
  download_url?: string;
  [k: string]: any;
};

export default function useWorkerEvents(userId?: string | number) {
  const [lastEvent, setLastEvent] = useState<WorkerEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    let wsUrl = "";
    if (apiBase) {
      // convert http(s) to ws(s)
      wsUrl = apiBase.replace(/^https?/, (m) => (m === "https" ? "wss" : "ws")) + `/api/v1/ws/${userId}`;
    } else {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      wsUrl = `${proto}://${window.location.host}/api/v1/ws/${userId}`;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // debug lifecycle
      // eslint-disable-next-line no-console
      console.debug("useWorkerEvents: ws open", { wsUrl });
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        // debug incoming message
        // eslint-disable-next-line no-console
        console.debug("useWorkerEvents: message", data);
        setLastEvent(data);
      } catch (e) {
        // ignore parse errors but log for easier debugging
        // eslint-disable-next-line no-console
        console.warn("useWorkerEvents: failed to parse message", ev.data);
      }
    };

    ws.onerror = (err) => {
      // eslint-disable-next-line no-console
      console.error("useWorkerEvents: ws error", err);
    };

    ws.onclose = (ev) => {
      // eslint-disable-next-line no-console
      console.debug("useWorkerEvents: ws closed", ev.reason || ev.code);
      wsRef.current = null;
    };

    return () => {
      try {
        ws.close();
      } catch (e) {
        // ignore
      }
    };
  }, [userId]);

  return { lastEvent };
}
