"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderDTO } from "@/types";

type OrderEventPayload =
  | { type: "ready" }
  | { type: "order.created"; order: OrderDTO }
  | { type: "order.updated"; order: OrderDTO };

// Loads orders once, then keeps them live via the SSE stream.
// `query` is the querystring for the initial GET (e.g. "active=1").
export function useOrderStream(query = "") {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const queryRef = useRef(query);
  queryRef.current = query;

  const upsert = useCallback((order: OrderDTO) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === order.id);
      if (idx === -1) return [order, ...prev];
      const next = [...prev];
      next[idx] = order;
      return next;
    });
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?${queryRef.current}`, {
        cache: "no-store",
      });
      if (res.ok) setOrders(await res.json());
    } catch {
      /* keep current */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();

    const source = new EventSource("/api/orders/stream");
    source.onopen = () => setConnected(true);
    source.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as OrderEventPayload;
        if (payload.type === "ready") {
          setConnected(true);
          return;
        }
        upsert(payload.order);
      } catch {
        /* ignore malformed frame */
      }
    };
    source.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects; refetch to catch anything missed.
    };

    return () => source.close();
  }, [refetch, upsert]);

  // Optimistically apply a status change and tell the server.
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
      } catch {
        refetch();
      }
    },
    [refetch]
  );

  return { orders, loading, connected, refetch, updateStatus };
}
