import { loadRoomMenu } from "@/lib/room-loader";
import { MenuClient } from "@/components/client/MenuClient";
import { RoomNotAvailable } from "@/components/RoomNotAvailable";

export const dynamic = "force-dynamic";

export default async function RoomMenuPage({
  params,
}: {
  params: { slug: string; number: string };
}) {
  const data = await loadRoomMenu(params.slug, params.number);
  if (!data) {
    return <RoomNotAvailable slug={params.slug} number={params.number} />;
  }

  return (
    <MenuClient
      hotel={data.hotel}
      room={data.room}
      menu={data.menu}
      recommendations={data.recommendations}
    />
  );
}
