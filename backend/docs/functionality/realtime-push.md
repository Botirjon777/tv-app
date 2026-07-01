# Functionality: Real-time push (WebSocket + Redis)

Source: `src/routes/room.ts` (`/ws`), `src/services/pushService.ts`,
`src/plugins/redis.ts`.

Delivers instant updates to room TVs without polling.

## How it works

1. A TV connects to `GET /api/v1/ws?token=<deviceToken>`. The handler validates
   the token, updates `lastSeenAt`, and derives the channel `room:<roomId>`.
2. It creates a **dedicated** Redis subscriber connection (`redisSub.duplicate()`)
   and `SUBSCRIBE`s that channel. Every message received is forwarded to the
   WebSocket.
3. Anywhere in the app, `pushToRoom(server, roomId, event)` `PUBLISH`es a JSON
   event to `room:<roomId>`. `broadcastToHotel(server, hotelId, event)` fans out
   to every room in a hotel.
4. On socket close, the subscriber unsubscribes and quits.

Because delivery goes through Redis pub/sub (not in-process memory), the backend
can run multiple instances behind a load balancer — any instance can reach a TV
connected to any other.

## Event types (`WsEventType`)

| Event | Sent when | Payload |
|-------|-----------|---------|
| `REFRESH_CONFIG` | Services/content change, guest created/modified | — |
| `CLEAR_GUEST` | Guest checked out / cancelled | — |
| `UPDATE_BACKGROUND` | Admin sets room background | `url` |
| `SHOW_ANNOUNCEMENT` | Admin pushes a message | `message`, `duration` |
| `REBOOT` | Admin triggers device reboot | — |

## Client keep-alive

The TV may send `{"type":"PING"}` and receives `{"type":"PONG"}`; the client uses
this for its connection watchdog. Missing/unknown token closes the socket with
code `4001`.
