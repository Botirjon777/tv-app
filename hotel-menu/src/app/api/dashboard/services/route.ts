import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { handle, ok, unauthorized } from "@/lib/http";
import { serviceInput } from "@/lib/validation";
import { translateFields } from "@/lib/translate";
import { serializeService } from "@/lib/serialize-menu";

// All dashboard service routes are scoped to the signed-in manager's hotel.
async function managerHotelId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.role === "manager" ? session.hotelId : null;
}

// GET /api/dashboard/services — the manager's hotel services.
export async function GET() {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const services = await prisma.hotelService.findMany({
      where: { hotelId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return ok(services.map(serializeService));
  });
}

// POST /api/dashboard/services — create a service (auto-translates name + desc).
export async function POST(req: Request) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = serviceInput.parse(body);

    const count = await prisma.hotelService.count({ where: { hotelId } });
    const translated = await translateFields(
      { name: data.name, description: data.description ?? "" },
      data.sourceLang
    );

    const service = await prisma.hotelService.create({
      data: {
        hotelId,
        name: data.name,
        description: data.description ?? "",
        sourceLang: data.sourceLang,
        nameI18n: JSON.stringify(translated.name),
        descI18n: JSON.stringify(translated.description),
        icon: data.icon ?? "",
        imageUrl: data.imageUrl ?? "",
        price: data.price ?? 0,
        sortOrder: data.sortOrder ?? count,
        active: data.active ?? true,
      },
    });
    return ok(serializeService(service), 201);
  });
}
