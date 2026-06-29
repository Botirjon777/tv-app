/* Guest service requests (alarm / reception / taxi / problem).
 *
 * Persisted directly to MongoDB so staff can review them. No external backend.
 */
import { prisma } from "@/lib/prisma";
import { fail, handle, ok } from "@/lib/http";

const TYPES = new Set(["ALARM", "SERVICE", "TAXI", "RECEPTION", "PROBLEM"]);

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const { hotelSlug, roomNumber, type, note, guestName } = body ?? {};

    if (!hotelSlug || !roomNumber || !TYPES.has(type)) {
      return fail("Invalid request", 400);
    }

    const request = await prisma.serviceRequest.create({
      data: {
        hotelSlug: String(hotelSlug),
        roomNumber: String(roomNumber),
        type,
        note: typeof note === "string" ? note : "",
        guestName: typeof guestName === "string" ? guestName : "",
        source: "web",
      },
    });

    return ok({ id: request.id }, 201);
  });
}
