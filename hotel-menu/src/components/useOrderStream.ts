"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderDTO } from "@/types";

const POLL_INTERVAL_MS = 4000;

// Loads orders and keeps them fresh by polling every few seconds. (Replaces the
// previous SSE stream so the app runs on any serverless host with no persistent
// connection.) `query` is the querystring for the GET (e.g. "active=1").
export function useOrderStream(query = "") {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const queryRef = useRef(query);
  queryRef.current = query;

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?${queryRef.current}`, {
        cache: "no-store",
      });
      if (res.ok) {
        setOrders(await res.json());
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const timer = setInterval(refetch, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refetch]);

  // Optimistically apply a status change, tell the server, then re-sync.
  const updateStatus = useCallback(
    async (orderId: string, status: OrderDTO["status"]) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } finally {
        refetch();
      }
    },
    [refetch]
  );

  return { orders, loading, connected, refetch, updateStatus };
}
