import { prisma } from "@/lib/prisma";
import { RoomExperience } from "@/components/client/RoomExperience";
import { DoorClosed } from "lucide-react";
import { parseI18n, type Lang } from "@/lib/i18n";
import type { MenuCategoryDTO, ProductDTO } from "@/types";

export const dynamic = "force-dynamic";

function NotAvailable({
  slug,
  number,
}: {
  slug: string;
  number: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2.5 bg-zinc-950 px-2.5 text-center text-zinc-100 lg:gap-5 lg:px-5">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500">
        <DoorClosed className="h-8 w-8" />
      </div>
      <h1 className="font-serif text-xl font-bold">Room not found</h1>
      <p className="max-w-xs text-sm text-zinc-400">
        The QR code you scanned points to room <strong>{number}</strong> at{" "}
        <strong>{slug}</strong>, which isn&apos;t available for ordering. Please
        contact the front desk.
      </p>
    </main>
  );
}

export default async function RoomMenuPage({
  params,
}: {
  params: { slug: string; number: string };
}) {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: params.slug },
  });
  if (!hotel || !hotel.active) {
    return <NotAvailable slug={params.slug} number={params.number} />;
  }

  const room = await prisma.room.findUnique({
    where: {
      hotelId_number: { hotelId: hotel.id, number: params.number },
    },
  });
  if (!room || !room.active) {
    return <NotAvailable slug={params.slug} number={params.number} />;
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: { available: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  const toProductDTO = (p: {
    id: string;
    name: string;
    description: string;
    sourceLang: string;
    nameI18n: string;
    descI18n: string;
    price: number;
    imageUrl: string;
    available: boolean;
    sortOrder: number;
    categoryId: string;
  }): ProductDTO => ({
    id: p.id,
    name: p.name,
    description: p.description,
    sourceLang: p.sourceLang as Lang,
    nameI18n: parseI18n(p.nameI18n),
    descI18n: parseI18n(p.descI18n),
    price: p.price,
    imageUrl: p.imageUrl,
    available: p.available,
    sortOrder: p.sortOrder,
    categoryId: p.categoryId,
  });

  const menu: MenuCategoryDTO[] = categories
    .filter((c) => c.products.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      sourceLang: c.sourceLang as Lang,
      nameI18n: parseI18n(c.nameI18n),
      sortOrder: c.sortOrder,
      products: c.products.map(toProductDTO),
    }));

  // Today's "recommendation of the day" — featured in the banner swiper.
  const today = new Date().getDay(); // 0=Sunday … 6=Saturday (server local time)
  const recs = await prisma.recommendation.findMany({
    where: { dayOfWeek: today, product: { available: true } },
    orderBy: { sortOrder: "asc" },
    include: { product: true },
  });
  const recommendations: ProductDTO[] = recs.map((r) =>
    toProductDTO(r.product)
  );

  return (
    <RoomExperience
      hotel={{
        slug: hotel.slug,
        name: hotel.name,
        imageUrl: (hotel as { imageUrl?: string }).imageUrl ?? "",
        logoUrl: hotel.logoUrl,
        tripadvisorUrl: hotel.tripadvisorUrl,
        googleMapsUrl: hotel.googleMapsUrl,
        yandexMapsUrl: hotel.yandexMapsUrl,
        wifiName: hotel.wifiName,
        wifiPassword: hotel.wifiPassword,
        instagramUrl: hotel.instagramUrl,
        telegramUrl: hotel.telegramUrl,
      }}
      room={{ id: room.id, number: room.number, name: room.name }}
      menu={menu}
      recommendations={recommendations}
    />
  );
}
