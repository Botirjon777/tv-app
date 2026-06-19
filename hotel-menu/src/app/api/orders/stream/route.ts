import { subscribeToOrders } from "@/lib/events";
import { getServerRole } from "@/lib/session";

// Server-Sent Events stream of live order events for the POS / admin.
// Stays open and pushes `order.created` / `order.updated` events as they happen.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const role = await getServerRole();
  if (!role) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          /* controller already closed */
        }
      };

      // Initial hello so the client knows the stream is live.
      send({ type: "ready" });

      unsubscribe = subscribeToOrders((event) => send(event));

      // Heartbeat keeps proxies from closing an idle connection.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* controller already closed */
        }
      }, 25000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
