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
