// Tiny in-process pub/sub used to push order updates to connected POS clients
// over Server-Sent Events. State lives on globalThis so it survives Next.js
// hot-reloads in development.
//
// NOTE: this is single-process only. For a horizontally-scaled deployment,
// swap this for Redis pub/sub (the publish/subscribe surface stays the same).

export type OrderEvent = {
  type: "order.created" | "order.updated";
  // The full order payload (already serialized for the client).
  order: unknown;
};

type Subscriber = (event: OrderEvent) => void;

const globalForEvents = globalThis as unknown as {
  orderSubscribers: Set<Subscriber> | undefined;
};

const subscribers: Set<Subscriber> =
  globalForEvents.orderSubscribers ?? new Set<Subscriber>();

globalForEvents.orderSubscribers = subscribers;

export function subscribeToOrders(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export function publishOrderEvent(event: OrderEvent): void {
  for (const fn of subscribers) {
    try {
      fn(event);
    } catch {
      // a broken subscriber must not break the others
    }
  }
}
