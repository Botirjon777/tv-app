/* Guest service requests (alarm / reception / taxi / problem).
 *
 * Persisted to MongoDB and pushed to the hotel's Telegram staff group.
 */
import { prisma } from "@/lib/prisma";
import { fail, handle, ok } from "@/lib/http";
import {
  formatRequestMessage,
  sendMessage,
  topicId,
  REQUEST_TYPE_TOPIC,
} from "@/lib/telegram";

const TYPES = new Set(["ALARM", "SERVICE", "TAXI", "RECEPTION", "PROBLEM"]);

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const { hotelSlug, roomNumber, type, note, guestName, destination, date, time } =
      body ?? {};

    if (!hotelSlug || !roomNumber || !TYPES.has(type)) {
      return fail("Invalid request", 400);
    }

    // Taxi/alarm carry a scheduled date + time (local).
    let scheduledFor: Date | null = null;
    if (typeof date === "string" && date) {
      const t = typeof time === "string" && time ? time : "00:00";
      const parsed = new Date(`${date}T${t}:00`);
      if (!Number.isNaN(parsed.getTime())) scheduledFor = parsed;
    }

    const request = await prisma.serviceRequest.create({
      data: {
        hotelSlug: String(hotelSlug),
        roomNumber: String(roomNumber),
        type,
        note: typeof note === "string" ? note : "",
        guestName: typeof guestName === "string" ? guestName : "",
        destination: typeof destination === "string" ? destination : "",
        scheduledFor,
        source: "web",
      },
    });

    // Notify the hotel's Telegram staff group (best-effort).
    const hotel = await prisma.hotel.findUnique({
      where: { slug: String(hotelSlug) },
      select: { telegramChatId: true, telegramTopics: true },
    });
    if (hotel?.telegramChatId) {
      const topicKey = REQUEST_TYPE_TOPIC[type];
      await sendMessage(
        hotel.telegramChatId,
        formatRequestMessage({
          type,
          roomNumber: String(roomNumber),
          destination: request.destination,
          scheduledFor: request.scheduledFor?.toISOString() ?? null,
          note: request.note,
          guestName: request.guestName,
        }),
        topicKey ? topicId(hotel.telegramTopics, topicKey) : undefined
      );
    }

    return ok({ id: request.id }, 201);
  });
}
