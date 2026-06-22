/* Guest service requests (alarm / reception / taxi).
 *
 * Forwards to the shared backend's public endpoint (POST /menu/requests), which
 * persists the request, notifies staff, and forwards to Telegram. We proxy
 * through this route (rather than hitting the backend from the browser) to keep
 * the backend URL server-side and mirror how /api/orders works.
 */
import { NextResponse } from "next/server";

const BASE = process.env.MENU_DATA_API_URL ?? "http://localhost:3000/api/v1";

const TYPES = new Set(["ALARM", "SERVICE", "TAXI", "RECEPTION", "PROBLEM"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { hotelSlug, roomNumber, type, note, guestName } = body ?? {};

  if (!hotelSlug || !roomNumber || !TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/menu/requests`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelSlug,
        roomNumber,
        type,
        note: typeof note === "string" ? note : "",
        guestName: typeof guestName === "string" ? guestName : "",
        source: "web",
      }),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) {
      return NextResponse.json(
        { error: json?.message || json?.error || "Request failed" },
        { status: res.status }
      );
    }
    return NextResponse.json(json.data ?? json, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the server" },
      { status: 502 }
    );
  }
}
