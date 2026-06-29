import fs from "node:fs";
import path from "node:path";

// Per-hotel branding images live under public/<slug>/, e.g.
//   public/safir/banner.webp
//   public/safir/logo.png
// Served by Next at /<slug>/banner.webp etc. We resolve by trying the common
// extensions so staff can drop in whatever format they have.

const PUBLIC_DIR = path.join(process.cwd(), "public");

const EXTENSIONS: Record<HotelAssetKind, string[]> = {
  banner: ["jpg", "jpeg", "png", "webp", "avif"],
  logo: ["png", "svg", "jpg", "jpeg", "webp"],
};

export type HotelAssetKind = "banner" | "logo";

// Returns the public URL for a hotel asset (e.g. "/safir/banner.webp"),
// or "" when no matching file exists under public/<slug>/.
export function resolveHotelAsset(slug: string, kind: HotelAssetKind): string {
  for (const ext of EXTENSIONS[kind]) {
    const relativePath = `${slug}/${kind}.${ext}`;
    if (fs.existsSync(path.join(PUBLIC_DIR, relativePath))) {
      return `/${relativePath}`;
    }
  }
  return "";
}
