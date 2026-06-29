// Turn a hotel name into a URL-safe slug, e.g. "Grand Plaza Hotel" -> "grand-plaza-hotel".
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics -> dash
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .slice(0, 60);
}

// Route segments that a hotel slug must never shadow.
export const RESERVED_SLUGS = new Set([
  "admin",
  "pos",
  "api",
  "hotel",
  "room",
  "_next",
]);

// Short numeric code a manager shares with the Telegram bot to link their group
// and uses (with a password) to sign into the POS. Caller ensures uniqueness.
export function generateConnectCode(): string {
  return String(100000 + Math.floor(Math.random() * 900000));
}

// Readable per-hotel POS password (no ambiguous characters).
export function generatePassword(length = 8): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// Floor-based room generator: floor 1 -> 101..1NN, floor 2 -> 201..2NN, etc.
export function generateRooms(
  floors: number,
  roomsPerFloor: number
): { number: string; floor: number; name: string }[] {
  const rooms: { number: string; floor: number; name: string }[] = [];
  for (let floor = 1; floor <= floors; floor++) {
    for (let r = 1; r <= roomsPerFloor; r++) {
      const number = `${floor}${String(r).padStart(2, "0")}`;
      rooms.push({ number, floor, name: `Room ${number}` });
    }
  }
  return rooms;
}
