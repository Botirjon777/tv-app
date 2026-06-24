import { DoorClosed } from "lucide-react";

// Shown when a QR code points to a hotel/room that doesn't exist or is inactive.
// Server-renderable (no client hooks); shared by the landing and menu routes.
export function RoomNotAvailable({
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
