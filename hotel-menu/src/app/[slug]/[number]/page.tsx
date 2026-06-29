import { loadRoomLanding } from "@/lib/room-loader";
import { RoomLanding } from "@/components/client/RoomLanding";
import { RoomNotAvailable } from "@/components/RoomNotAvailable";

export const dynamic = "force-dynamic";

export default async function RoomLandingPage({
  params,
}: {
  params: { slug: string; number: string };
}) {
  const data = await loadRoomLanding(params.slug, params.number);
  if (!data) {
    return <RoomNotAvailable slug={params.slug} number={params.number} />;
  }

  return <RoomLanding hotel={data.hotel} room={data.room} />;
}
